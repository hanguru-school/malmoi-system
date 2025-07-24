// AWS Configuration for Booking System
const AWS = require('aws-sdk');

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'ap-northeast-2', // 서울 리전
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

// S3 Configuration for file uploads
const s3Config = {
  bucketName: process.env.AWS_S3_BUCKET || 'malmoi-system-files',
  region: process.env.AWS_REGION || 'ap-northeast-2',
};

// RDS Configuration for database
const rdsConfig = {
  host: process.env.AWS_RDS_HOST,
  port: process.env.AWS_RDS_PORT || 5432,
  database: process.env.AWS_RDS_DATABASE || 'booking_system',
  username: process.env.AWS_RDS_USERNAME,
  password: process.env.AWS_RDS_PASSWORD,
};

module.exports = {
  awsConfig,
  s3Config,
  rdsConfig,
}; 