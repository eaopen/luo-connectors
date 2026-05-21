/**
 * R2 Bucket bindings
 */

export interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

export interface R2Object {
  key: string;
  value: ReadableStream;
  metadata?: Record<string, string>;
  size?: number;
  httpMetadata?: Record<string, string>;
  write(): Promise<WritableStream>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface R2PutOptions {
  httpMetadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
}

export interface R2ListOptions {
  limit?: number;
  cursor?: string;
  prefix?: string;
}

export interface R2Objects {
  objects: Array<{
    key: string;
    size?: number;
    uploaded?: Date;
  }>;
  truncated?: boolean;
  cursor?: string;
}
