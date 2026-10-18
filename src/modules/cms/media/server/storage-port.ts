import "server-only";

export type PresignedUpload = Readonly<{
  expiresAt: Date;
  headers: Readonly<Record<string, string>>;
  method: "PUT";
  url: string;
}>;

export type StoredObjectHead = Readonly<{
  byteSize: number;
  checksumSha256?: string;
  contentType?: string;
}>;

export interface MediaStorage {
  copyObject(
    input: Readonly<{
      cacheControl: string;
      contentType: string;
      destinationKey: string;
      sourceKey: string;
    }>
  ): Promise<void>;
  createPresignedRead(
    input: Readonly<{ expiresInSeconds: number; key: string }>
  ): Promise<string>;
  createPresignedUpload(
    input: Readonly<{
      checksumSha256?: string;
      contentType: string;
      expiresInSeconds: number;
      key: string;
    }>
  ): Promise<PresignedUpload>;
  deleteObject(key: string): Promise<void>;
  headObject(key: string): Promise<StoredObjectHead>;
  objectExists(key: string): Promise<boolean>;
  readObjectRange(
    input: Readonly<{ endInclusive: number; key: string; start: number }>
  ): Promise<Uint8Array>;
}
