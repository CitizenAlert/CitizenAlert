import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class StorageService implements OnModuleInit {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;
  private region: string;

  constructor(private config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    this.region = this.config.get<string>('S3_REGION', 'us-east-1');
    this.bucket = this.config.get<string>('S3_BUCKET', 'citizen-alert-images');
    this.endpoint = endpoint;

    this.client = new S3Client({
      endpoint,
      region: this.region,
      credentials: {
        accessKeyId: this.config.get<string>('MINIO_ROOT_USER', 'minioadmin'),
        secretAccessKey: this.config.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin'),
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBucket();
    } catch (err) {
      console.warn(
        'S3/MinIO bucket check failed. Uploads will fail until storage is available:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      };
      try {
        await this.client.send(
          new PutBucketPolicyCommand({
            Bucket: this.bucket,
            Policy: JSON.stringify(policy),
          }),
        );
      } catch {
        // MinIO might not support PutBucketPolicy in all versions; objects may need presigned URLs
      }
    }
  }

  /**
   * Upload a file to S3 and return its key (for use with /hazards/image/:id).
   * The key is stored in the database instead of the full URL.
   */
  async upload(
    buffer: Buffer,
    key: string,
    mimeType: string = 'image/jpeg',
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    // Return the key instead of the full URL
    return key;
  }

  /**
   * Retrieve an image from S3 using its key.
   */
  async getImage(key: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      throw new Error(`Could not retrieve image: ${error instanceof Error ? error.message : error}`);
    }
  }

  private getPublicUrl(key: string): string {
    const publicEndpoint = this.config.get<string>('S3_PUBLIC_ENDPOINT', this.endpoint);
    const base = publicEndpoint.replace(/\/$/, '');
    return `${base}/${this.bucket}/${key}`;
  }
}
