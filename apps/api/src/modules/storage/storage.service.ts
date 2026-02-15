import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
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
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY', 'minioadmin'),
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
   * Upload a file to S3 and return its public URL.
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
    return this.getPublicUrl(key);
  }

  private getPublicUrl(key: string): string {
    const base = this.endpoint.replace(/\/$/, '');
    return `${base}/${this.bucket}/${key}`;
  }
}
