import AWS from 'aws-sdk';
import { awsConfig, s3Config } from '../../aws-config';

// Configure AWS
AWS.config.update(awsConfig);

// Create S3 instance
const s3 = new AWS.S3();

export class S3Service {
  constructor() {
    this.bucketName = s3Config.bucketName;
  }

  // Upload file to S3
  async uploadFile(file, key, contentType = 'application/octet-stream') {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read', // Make file publicly accessible
      Metadata: {
        'upload-date': new Date().toISOString(),
        'original-name': file.name || 'unknown'
      }
    };

    try {
      const result = await s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  }

  // Delete file from S3
  async deleteFile(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    try {
      await s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      throw error;
    }
  }

  // Get file URL
  getFileUrl(key) {
    return `https://${this.bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
  }

  // List files in bucket
  async listFiles(prefix = '') {
    const params = {
      Bucket: this.bucketName,
      Prefix: prefix,
    };

    try {
      const result = await s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      console.error('S3 list error:', error);
      throw error;
    }
  }

  // Get file versions (if versioning is enabled)
  async getFileVersions(key) {
    const params = {
      Bucket: this.bucketName,
      Prefix: key,
    };

    try {
      const result = await s3.listObjectVersions(params).promise();
      return result.Versions || [];
    } catch (error) {
      console.error('S3 version list error:', error);
      throw error;
    }
  }

  // Restore previous version
  async restoreFileVersion(key, versionId) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      VersionId: versionId,
    };

    try {
      await s3.copyObject({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${key}?versionId=${versionId}`,
        Key: key,
      }).promise();
      return true;
    } catch (error) {
      console.error('S3 restore error:', error);
      throw error;
    }
  }
}

export const s3Service = new S3Service(); 