# luo-calendar-workers

> Cloudflare Workers for Luo Rhythm API

## 项目简介

Cloudflare Workers 实现 `api-luo.openea.site` API 服务层，直接从 R2 静态文件提供数据响应。

### 架构设计

```
┌─────────────────────────────────────────────┐
│        请求流向                         │
├─────────────────────────────────────────────┤
│  客户端请求                              │
│  GET /v1/day/2026-03-20                 │
│  GET /v1/month/2026-03                  │
│  GET /v1/year/2026                      │
├─────────────────────────────────────────────┤
│  Cloudflare Workers (边缘计算)               │
│  - 解析日期参数                           │
│  - 从 R2 获取静态年包 JSON               │
│  - 缓存响应 (1 年 TTL)                  │
│  - 返回 GCA-v1 JSON                       │
├─────────────────────────────────────────────┤
│  Cloudflare R2 (静态存储)                │
│  - calendar-2026.json.gz                  │
│  - calendar-2026.json                     │
│  - 年包内含 months -> days               │
└─────────────────────────────────────────────┘
```

### 核心特点

- **零依赖**：不依赖任何后端服务
- **边缘缓存**：全球 CDN 节点缓存
- **压缩感知**：自动处理 `.gz` 文件
- **错误处理**：友好的错误响应

## 快速开始

### 环境要求

- **Node.js**: 18+
- **Wrangler**: 3.x (Cloudflare Workers CLI)
- **Cloudflare**: 账号 + R2 存储桶

### 安装依赖

```bash
cd luo-connectors/cal-workers
npm install
```

### 本地开发

```bash
# 开发模式
npx wrangler dev

# 预览路由
open http://localhost:8787/v1/day/2026-03-20
```

### 部署

```bash
# 部署到 Cloudflare
npx wrangler deploy

# 查看日志
npx wrangler tail
```

## API 端点

### GET /v1/day/{date}

返回指定日期的历法数据。Workers 会从对应年份年包中运行时提取当日结果。

**请求参数**:

| 参数 | 类型 | 示例 | 必填 |
|------|------|------|--------|
| date | string | `2026-03-20` | ✅ |

**日期格式**: `YYYY-MM-DD` (ISO 8601)

**请求示例**:

```bash
curl https://api-luo.openea.site/v1/day/2026-03-20
```

如需返回节气精确发生时刻，可追加 `include=solar-term-times`：

```bash
curl "https://api-luo.openea.site/v1/day/2026-03-20?include=solar-term-times"
```

**响应示例**:

```json
{
  "version": "1.0",
  "anchor": {
    "iso_8601": "2026-03-20",
    "weekday": 5
  },
  "chinese_lunar": {
    "animal": "马",
    "day": "初二",
    "month": {
      "name": "二月",
      "is_leap": false,
      "alias": "仲春"
    },
    "solar_term": {
      "name": "春分",
      "next": "清明",
      "countdown": 15
    }
  },
  "history": {
    "east_asia": [],
    "calendar_transitions": [],
    "notable_events": []
  },
  "religious": {
    "orthodox": null,
    "hebrew": null,
    "indian": null,
    "islamic": null
  },
  "meta": {
    "lifestyle": {
      "suit": ["祭祀"],
      "avoid": ["嫁娶"]
    }
  },
  "runtime": {
    "region_code": "CN",
    "data_quality": "PRECISE"
  }
}
```

**带节气时刻元数据的响应示例**:

```json
{
  "version": "1.0",
  "anchor": {
    "iso_8601": "2026-03-20",
    "weekday": 5
  },
  "chinese_lunar": {
    "solar_term": {
      "name": "春分",
      "next": "清明",
      "countdown": 15
    }
  },
  "runtime": {
    "region_code": "CN",
    "data_quality": "PRECISE"
  },
  "metadata": {
    "solar_terms": {
      "zone_id": "Asia/Shanghai",
      "occurrences": [
        {
          "index": 2,
          "major": true,
          "name": "春分",
          "local_date": "2026-03-20",
          "occurs_at_utc": "2026-03-20T09:01:00Z",
          "occurs_at_zoned": "2026-03-20T17:01:00+08:00"
        }
      ],
      "today": {
        "index": 2,
        "major": true,
        "name": "春分",
        "local_date": "2026-03-20",
        "occurs_at_utc": "2026-03-20T09:01:00Z",
        "occurs_at_zoned": "2026-03-20T17:01:00+08:00"
      },
      "next": {
        "index": 3,
        "major": false,
        "name": "清明",
        "local_date": "2026-04-04",
        "occurs_at_utc": "2026-04-04T08:00:00Z",
        "occurs_at_zoned": "2026-04-04T16:00:00+08:00"
      }
    }
  }
}
```

### GET /v1/month/{month}

返回指定月份的历法数据。

**请求参数**:

| 参数 | 类型 | 示例 | 必填 |
|------|------|------|--------|
| month | string | `2026-03` | ✅ |

**月份格式**: `YYYY-MM`

**请求示例**:

```bash
curl https://api-luo.openea.site/v1/month/2026-03
```

返回月级节气时刻元数据：

```bash
curl "https://api-luo.openea.site/v1/month/2026-03?include=solar-term-times"
```

**响应示例**:

```json
{
  "year": 2026,
  "month": 3,
  "iso_month": "2026-03",
  "region_code": "CN",
  "data_quality": "PRECISE",
  "days": [
    {
      "anchor": {
        "iso_8601": "2026-03-01"
      },
      "runtime": {
        "region_code": "CN",
        "data_quality": "PRECISE"
      }
    },
    {
      "anchor": {
        "iso_8601": "2026-03-20"
      },
      "runtime": {
        "region_code": "CN",
        "data_quality": "PRECISE"
      }
    }
  ]
}
```

**带节气时刻元数据的响应示例**:

```json
{
  "year": 2026,
  "month": 3,
  "iso_month": "2026-03",
  "region_code": "CN",
  "data_quality": "PRECISE",
  "days": [
    {
      "anchor": {
        "iso_8601": "2026-03-20"
      }
    }
  ],
  "metadata": {
    "solar_terms": {
      "zone_id": "Asia/Shanghai",
      "occurrences": [
        {
          "index": 2,
          "major": true,
          "name": "春分",
          "local_date": "2026-03-20",
          "occurs_at_utc": "2026-03-20T09:01:00Z",
          "occurs_at_zoned": "2026-03-20T17:01:00+08:00"
        }
      ],
      "today": null,
      "next": null
    }
  }
}
```

### GET /v1/year/{year}

返回指定年份的历法年包。

**请求参数**:

| 参数 | 类型 | 示例 | 必填 |
|------|------|------|--------|
| year | string | `2026` | ✅ |

**请求示例**:

```bash
curl https://api-luo.openea.site/v1/year/2026
```

返回全年节气时刻元数据：

```bash
curl "https://api-luo.openea.site/v1/year/2026?include=solar-term-times"
```

**响应示例**:

```json
{
  "year": 2026,
  "region_code": "CN",
  "data_quality": "PRECISE",
  "months": [
    {
      "year": 2026,
      "month": 1,
      "iso_month": "2026-01",
      "region_code": "CN",
      "data_quality": "PRECISE",
      "days": [
        {
          "anchor": {
            "iso_8601": "2026-01-01"
          }
        }
      ]
    },
    {
      "year": 2026,
      "month": 2,
      "iso_month": "2026-02",
      "region_code": "CN",
      "data_quality": "PRECISE",
      "days": [
        {
          "anchor": {
            "iso_8601": "2026-02-01"
          }
        }
      ]
    }
  ]
}
```

### GET /v1/badge/today

返回动态 SVG badge，可直接用于 GitHub README 图片链接。

**请求示例**:

```bash
curl https://api-luo.openea.site/v1/badge/today
```

### GET /v1/badge/day/{date}

返回指定日期的动态 SVG badge。

**请求示例**:

```bash
curl https://api-luo.openea.site/v1/badge/day/2026-03-20
```

**带节气时刻元数据的响应示例**:

```json
{
  "year": 2026,
  "region_code": "CN",
  "data_quality": "PRECISE",
  "months": [
    {
      "year": 2026,
      "month": 1,
      "iso_month": "2026-01",
      "days": [
        {
          "anchor": {
            "iso_8601": "2026-01-01"
          }
        }
      ]
    }
  ],
  "metadata": {
    "solar_terms": {
      "zone_id": "Asia/Shanghai",
      "occurrences": [
        {
          "index": 11,
          "major": false,
          "name": "小寒",
          "local_date": "2026-01-05",
          "occurs_at_utc": "2026-01-05T09:00:00Z",
          "occurs_at_zoned": "2026-01-05T17:00:00+08:00"
        },
        {
          "index": 2,
          "major": true,
          "name": "春分",
          "local_date": "2026-03-20",
          "occurs_at_utc": "2026-03-20T09:01:00Z",
          "occurs_at_zoned": "2026-03-20T17:01:00+08:00"
        }
      ],
      "today": null,
      "next": null
    }
  }
}
```

### 可选元数据说明

- 默认响应不会返回 `metadata` 字段，便于保持体积更小。
- 只有当查询参数包含 `include=solar-term-times` 时，Workers 才会把精确节气时刻透传出来。
- `day` 响应的 `metadata.solar_terms` 会额外带 `today` 和 `next`。
- `month/year` 响应的 `metadata.solar_terms` 主要返回范围内的 `occurrences` 列表。

### 年包结构

R2 中的 `calendar-{year}.json(.gz)` 现已切换为年包分发格式：

```json
{
  "year": 2026,
  "region_code": "CN",
  "data_quality": "PRECISE",
  "months": [
    {
      "year": 2026,
      "month": 3,
      "iso_month": "2026-03",
      "region_code": "CN",
      "data_quality": "PRECISE",
      "days": []
    }
  ]
}
```

### 响应头示例

成功返回时通常会包含这些头：

```http
Content-Type: application/json; charset=utf-8
Cache-Control: public, max-age=31536000, s-maxage=31536000
CDN-Cache-Control: public, max-age=31536000
Access-Control-Allow-Origin: *
X-Cache: MISS
```

### 完整日视图示例

```json
{
  "version": "1.0",
  "anchor": {
    "iso_8601": "2026-03-20",
    "jdn": 2460809,
    "unix_timestamp": 1776998400,
    "weekday": 4
  },
  "chinese_lunar": {
    "cycle": "丙午",
    "animal": "马",
    "month": {
      "name": "二月",
      "is_leap": false,
      "alias": "仲春"
    },
    "day": "初一",
    "solar_term": {
      "name": "春分",
      "next": null,
      "countdown": 0
    },
    "phenology": {
      "pentad": "鹰化为鸠",
      "note": null
    }
  },
  "history": {
    "east_asia": [],
    "notable_events": []
  },
  "religious": {
    "islamic": null,
    "hebrew": null,
    "indian": null,
    "orthodox": null
  },
  "synthetic": {
    "french_republican": null,
    "stardate": null,
    "holocene": null
  },
  "meta": {
    "aesthetic": {
      "traditional_color": {
        "name": "天青",
        "hex": "#87B8DE"
      },
      "visual_keywords": "minimalist peach blossom zen",
      "font_suggestion": "Zhi Mang Xing"
    },
    "ai_hints": {
      "system_prompt": null,
      "generation_prompt": null
    },
    "lifestyle": {
      "suit": ["塞穴", "整手足甲"],
      "avoid": ["嫁娶", "作灶"]
    }
  }
}
```

### 错误响应

| 状态码 | 说明 | 响应示例 |
|--------|------|-----------|
| 400 | 日期格式错误 | `{"error": "Invalid date format. Use YYYY-MM-DD"}` |
| 400 | 月份格式错误 | `{"error": "Invalid month format. Use YYYY-MM"}` |
| 400 | 年份格式错误 | `{"error": "Invalid year format. Use YYYY"}` |
| 404 | 日期文件不存在 | `{"error": "Calendar data not found for 2026-03-20"}` |
| 404 | 月份或年份数据不存在 | `{"error": "Calendar data not found for 2026-03"}` |
| 500 | 服务器错误 | `{"error": "Internal server error"}` |

## 项目结构

```
cal-workers/
├── src/
│   ├── index.ts           # Workers 入口
│   ├── handlers.ts        # day/month/year 请求处理器
│   ├── cache.ts           # 缓存管理
│   ├── handlers.test.ts   # payload 兼容性测试
│   └── index.test.ts      # 路由测试
├── wrangler.toml        # Wrangler 配置
├── package.json         # Node.js 依赖
├── tsconfig.json        # TypeScript 配置
└── README.md           # 本文档
```

## 配置

### wrangler.toml

```toml
name = "luo-calendar-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# 环境变量
[vars]
R2_BUCKET_NAME = "luo-calendar-data"
R2_KV_NAMESPACE = "luo_cache"
API_VERSION = "v1"

# R2 绑定
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "luo-calendar-data"

# KV 绑定（可选，用于缓存控制）
[[kv_namespaces]]
binding = "CACHE"
namespace_id = "luo_cache"
```

### 环境变量

| 变量 | 说明 | 示例值 |
|------|------|---------|
| R2_BUCKET_NAME | R2 存储桶名称 | `luo-calendar-data` |
| R2_KV_NAMESPACE | KV 命名空间（可选） | `luo_cache` |
| API_VERSION | API 版本 | `v1` |

## 缓存策略

### 边缘缓存

```
请求 → Workers → R2 → 响应
    ↓
  Cache-Control: public, max-age=31536000 (1 年)
```

### KV 缓存（可选）

用于热点 day/month/year 请求的加速访问：

```typescript
// 缓存今日数据 10 分钟
const today = new Date().toISOString().split('T')[0];
const cached = await CACHE.get(`day:${today}`);

if (cached) {
  return new Response(cached, { headers: { 'X-Cache': 'HIT' } });
}
```

## 性能目标

| 指标 | 目标值 |
|--------|---------|
| 响应时间 | < 100ms (P95) |
| 响应大小 | < 1KB (gzip 后) |
| 缓存命中率 | > 80% |
| 可用性 | > 99.9% |

## 部署检查清单

- [ ] Wrangler 已安装
- [ ] R2 存储桶已创建
- [ ] R2 绑定已配置
- [ ] 域名 `api-luo.openea.site` 已绑定到 Workers
- [ ] 生产数据已上传到 R2
- [ ] Workers 已部署
- [ ] 日志监控已启用

## 故障排查

### 常见问题

**Q: R2 文件 404**
- 检查 `luo-factory` 是否已生成并上传数据
- 确认 R2 桶名称配置正确

**Q: Workers 部署失败**
- 检查 wrangler.toml 配置
- 确认 Cloudflare 账户权限

**Q: 域名无法访问**
- 确认 DNS 已绑定到 Workers
- 检查 Cloudflare Workers 路由设置

## 许可证

MIT License

## 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers)
- [R2 存储文档](https://developers.cloudflare.com/r2)
- [Obsidian 插件](https://github.com/openea/luo-obsidian-plugin)
