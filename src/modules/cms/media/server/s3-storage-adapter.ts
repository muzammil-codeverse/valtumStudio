import "server-only";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { EnabledMediaEnvironment } from "@/config/env/media";

import { toStorageError } from "./storage-errors";
import type { MediaStorage, PresignedUpload, StoredObjectHead } from "./storage-port";

const requestTimeoutMs = 10_000;

function requestSignal(): AbortSignal {
  return AbortSignal.timeout(requestTimeoutMs);
}

async function readBody(body: unknown): Promise<Uint8Array> {
  if (
    typeof body === "object" &&
    body !== null &&
    "transformToByteArray" in body &&
    typeof body.transformToByteArray === "function"
  ) {
    return body.transformToByteArray();
  }
  throw new Error("Storage response body does not support byte reads.");
}

export class S3MediaStorageAdapter implements MediaStorage {
  private readonly client: S3Client;

  public constructor(private readonly configuration: EnabledMediaEnvironment) {
    this.client = new S3Client({
      credentials: {
        accessKeyId: configuration.MEDIA_S3_ACCESS_KEY_ID,
        secretAccessKey: configuration.MEDIA_S3_SECRET_ACCESS_KEY
      },
      endpoint: configuration.MEDIA_S3_ENDPOINT,
      forcePathStyle: configuration.MEDIA_S3_FORCE_PATH_STYLE,
      region: configuration.MEDIA_S3_REGION
    });
  }

  public async createPresignedUpload(
    input: Readonly<{
      checksumSha256?: string;
      contentType: string;
      expiresInSeconds: number;
      key: string;
    }>
  ): Promise<PresignedUpload> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.configuration.MEDIA_S3_BUCKET,
        CacheControl: "no-store",
        ContentType: input.contentType,
        ...(input.checksumSha256 === undefined
          ? {}
          : { ChecksumSHA256: input.checksumSha256 }),
        Key: input.key
      });
      const url = await getSignedUrl(this.client, command, {
        expiresIn: input.expiresInSeconds
      });
      const headers: Record<string, string> = { "content-type": input.contentType };
      if (input.checksumSha256 !== undefined) {
        headers["x-amz-checksum-sha256"] = input.checksumSha256;
      }
      return {
        expiresAt: new Date(Date.now() + input.expiresInSeconds * 1_000),
        headers,
        method: "PUT",
        url
      };
    } catch (error) {
      throw toStorageError(error);
    }
  }

  public async headObject(key: string): Promise<StoredObjectHead> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({ Bucket: this.configuration.MEDIA_S3_BUCKET, Key: key }),
        { abortSignal: requestSignal() }
      );
      if (response.ContentLength === undefined || response.ContentLength < 0) {
        throw new Error("Storage object did not provide its length.");
      }
      const result: StoredObjectHead = {
        byteSize: response.ContentLength,
        ...(response.ChecksumSHA256 === undefined
          ? {}
          : { checksumSha256: response.ChecksumSHA256 }),
        ...(response.ContentType === undefined
          ? {}
          : { contentType: response.ContentType })
      };
      return result;
    } catch (error) {
      throw toStorageError(error);
    }
  }

  public async readObjectRange(
    input: Readonly<{
      endInclusive: number;
      key: string;
      start: number;
    }>
  ): Promise<Uint8Array> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.configuration.MEDIA_S3_BUCKET,
          Key: input.key,
          Range: `bytes=${String(input.start)}-${String(input.endInclusive)}`
        }),
        { abortSignal: requestSignal() }
      );
      return readBody(response.Body);
    } catch (error) {
      throw toStorageError(error);
    }
  }

  public async copyObject(
    input: Readonly<{
      cacheControl: string;
      contentType: string;
      destinationKey: string;
      sourceKey: string;
    }>
  ): Promise<void> {
    try {
      const source = `${this.configuration.MEDIA_S3_BUCKET}/${input.sourceKey
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`;
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.configuration.MEDIA_S3_BUCKET,
          CacheControl: input.cacheControl,
          ContentType: input.contentType,
          CopySource: source,
          Key: input.destinationKey,
          MetadataDirective: "REPLACE"
        }),
        { abortSignal: requestSignal() }
      );
    } catch (error) {
      throw toStorageError(error);
    }
  }

  public async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.configuration.MEDIA_S3_BUCKET,
          Key: key
        }),
        { abortSignal: requestSignal() }
      );
    } catch (error) {
      throw toStorageError(error);
    }
  }

  public async createPresignedRead(
    input: Readonly<{
      expiresInSeconds: number;
      key: string;
    }>
  ): Promise<string> {
    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: this.configuration.MEDIA_S3_BUCKET,
          Key: input.key
        }),
        { expiresIn: input.expiresInSeconds }
      );
    } catch (error) {
      throw toStorageError(error);
    }
  }

  public async objectExists(key: string): Promise<boolean> {
    try {
      await this.headObject(key);
      return true;
    } catch (error) {
      return toStorageError(error).code !== "NOT_FOUND"
        ? Promise.reject(toStorageError(error))
        : false;
    }
  }
}
