import { readFile } from "node:fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "../config.js";

const s3 = new S3Client({
  endpoint: config.storage.endpoint,
  region: config.storage.region,
  credentials: {
    accessKeyId: config.storage.accessKeyId,
    secretAccessKey: config.storage.secretAccessKey,
  },
});

export async function uploadFile(
  localPath: string,
  key: string,
  contentType: string,
): Promise<string> {
  const body = await readFile(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `${config.storage.publicBaseUrl}/${key}`;
}
