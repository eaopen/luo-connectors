# Cloudflare Workers 部署指南

> 完整的 API 部署步骤

## 前置条件

1. **Cloudflare 账户**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 创建或确认 Workers 计划

2. **R2 存储桶**
   - 在 R2 中创建 `luo-calendar-data` 存储桶
   - 获取访问密钥（Access Key ID + Secret Access Key）

3. **Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

## 部署步骤

### 步骤 1: 配置环境变量

创建 `dev.vars` 文件（仅本地开发）：

```bash
R2_BUCKET_NAME=luo-calendar-data
R2_KV_NAMESPACE=luo_cache
API_VERSION=v1
```

### 步骤 2: 部署到 Cloudflare

```bash
cd luo-connectors/cal-workers

# 开发模式（本地测试）
wrangler dev

# 生产部署
wrangler deploy
```

### 步骤 3: 验证部署

```bash
# 查看实时日志
wrangler tail

# 测试 API 端点
curl https://api-luo.openea.site/v1/day/2026-03-20
curl https://api-luo.openea.site/v1/month/2026-03
curl https://api-luo.openea.site/v1/year/2026
```

推荐直接看状态码和关键响应头：

```bash
curl -i https://api-luo.openea.site/v1/day/2026-03-20
curl -i https://api-luo.openea.site/v1/month/2026-03
curl -i https://api-luo.openea.site/v1/year/2026
```

预期至少看到：

```http
HTTP/2 200
content-type: application/json; charset=utf-8
cache-control: public, max-age=31536000, s-maxage=31536000
access-control-allow-origin: *
```

如果只想快速确认字段结构，可以配合 `jq`：

```bash
curl -s https://api-luo.openea.site/v1/day/2026-03-20 | jq '.anchor.iso_8601, .runtime.region_code, .runtime.data_quality'
curl -s https://api-luo.openea.site/v1/month/2026-03 | jq '.iso_month, (.days | length)'
curl -s https://api-luo.openea.site/v1/year/2026 | jq '.year, (.months | length)'
curl -s "https://api-luo.openea.site/v1/day/2026-03-20?include=solar-term-times" | jq '.metadata.solar_terms.today.name, .metadata.solar_terms.today.occurs_at_zoned'
curl -s "https://api-luo.openea.site/v1/month/2026-03?include=solar-term-times" | jq '.metadata.solar_terms.zone_id, (.metadata.solar_terms.occurrences | length)'
curl -s "https://api-luo.openea.site/v1/year/2026?include=solar-term-times" | jq '.metadata.solar_terms.zone_id, (.metadata.solar_terms.occurrences | length)'
```

预期输出类似：

```text
"2026-03-20"
"CN"
"PRECISE"
"2026-03"
31
2026
12
"春分"
"2026-03-20T17:01:00+08:00"
"Asia/Shanghai"
1
"Asia/Shanghai"
24
```

如果想确认默认响应不会额外返回节气时刻元数据，可以直接看 `metadata`：

```bash
curl -s https://api-luo.openea.site/v1/day/2026-03-20 | jq '.metadata'
curl -s https://api-luo.openea.site/v1/month/2026-03 | jq '.metadata'
curl -s https://api-luo.openea.site/v1/year/2026 | jq '.metadata'
```

预期输出：

```text
null
null
null
```

## 域名配置

### 在 Cloudflare Dashboard 中

1. **Workers & Pages** → **Workers**
2. 找到 `luo-calendar-api` Worker
3. 点击 **Triggers** → **Custom Domains**
4. 添加域名：`api-luo.openea.site`
5. 保存并等待 DNS 生效

### 路由配置

Workers 自动处理以下路由：
```
https://api-luo.openea.site/* → luo-calendar-api Worker
```

## 数据上传流程

### 生成数据

```bash
cd luo-factory

# 年包生成
./scripts/generate.sh
```

### 上传到 R2

使用 AWS S3 SDK 上传：

```bash
# 安装 AWS CLI
brew install awscli

# 配置凭据
aws configure \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile-name r2

# 上传文件
aws s3 cp ./output/calendar-2026.json.gz \
  s3://luo-calendar-data/ \
  --profile r2

# 上传所有文件
aws s3 sync ./output/ s3://luo-calendar-data/ \
  --profile r2 \
  --delete
```

或使用 Wrangler R2 上传：

```bash
wrangler r2 object put \
  luo-calendar-data/calendar-2026.json.gz \
  --file=./output/calendar-2026.json.gz
```

## 监控与日志

### 查看日志

```bash
# 实时日志流
wrangler tail luo-calendar-api

# 带过滤的日志
wrangler tail luo-calendar-api --format=pretty
```

### 监控指标

在 Cloudflare Dashboard 中查看：
- 请求量（Requests）
- 响应时间（Response Time）
- 错误率（Error Rate）
- 缓存命中率（Cache Hit Rate）

## 故障排查

### 常见问题

**Q: 部署失败**
```bash
# 检查登录状态
wrangler whoami

# 重新登录
wrangler logout
wrangler login
```

**Q: R2 文件 404**
```bash
# 列出 R2 文件
wrangler r2 object list luo-calendar-data

# 检查文件名是否正确
```

**Q: CORS 错误**
- 检查 Workers 代码中的 CORS 头
- 确认 `Access-Control-Allow-Origin: *`

**Q: 域名无法访问**
- 检查 DNS 是否生效：`dig api-luo.openea.site`
- 等待 DNS 传播（最多 24 小时）

### 性能调优

**缓存策略**：
- 今日数据：KV 缓存 10 分钟
- 近期数据：KV 缓存 1 小时
- 历史数据：R2 缓存 1 年

**边缘优化**：
- 启用 Cloudflare Smart Placement
- 配置适当的 CPU 时间限制
- 使用 GZIP 压缩

## 部署检查清单

- [ ] Wrangler 已安装并登录
- [ ] R2 存储桶已创建
- [ ] R2 绑定已配置（wrangler.toml）
- [ ] KV 命名空间已创建（可选）
- [ ] 域名已绑定到 Workers
- [ ] luo-factory 数据已生成
- [ ] 数据已上传到 R2
- [ ] Workers 已部署
- [ ] API 端点可访问
- [ ] 日志监控已启用

## 下一步

部署完成后，测试以下场景：

1. **基本功能**
   ```bash
   curl https://api-luo.openea.site/v1/day/2026-03-20
   curl https://api-luo.openea.site/v1/month/2026-03
   curl https://api-luo.openea.site/v1/year/2026
   curl "https://api-luo.openea.site/v1/day/2026-03-20?include=solar-term-times"
   curl "https://api-luo.openea.site/v1/month/2026-03?include=solar-term-times"
   curl "https://api-luo.openea.site/v1/year/2026?include=solar-term-times"
   ```
   预期：
   - `day` 返回单日 `LuoDay`
   - `month` 返回 `iso_month` 和当月 `days`
   - `year` 返回 `months` 数组
   - 带 `include=solar-term-times` 时返回 `metadata.solar_terms`

2. **错误处理**
   ```bash
   curl https://api-luo.openea.site/v1/day/invalid-date
   curl https://api-luo.openea.site/v1/day/9999-99-99
   curl https://api-luo.openea.site/v1/month/2026-13
   curl https://api-luo.openea.site/v1/year/26
   ```
   预期：
   - 非法参数返回 `400`
   - 不存在的数据返回 `404`

3. **GZIP 支持**
   ```bash
   curl -i -H "Accept-Encoding: gzip" \
     https://api-luo.openea.site/v1/day/2026-03-20
   ```
   预期：
   - 即使 R2 只上传了 `calendar-2026.json.gz`，接口仍可正常返回 `200`

4. **CORS 测试**
   ```bash
   curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api-luo.openea.site/v1/day/2026-03-20
   ```
   预期：
   - 返回 `204`
   - 包含 `Access-Control-Allow-Origin: *`
