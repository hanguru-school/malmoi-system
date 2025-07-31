import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Node.js 런타임 명시
export const runtime = 'nodejs';

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.S3_BUCKET_NAME || 'malmoi-system-files';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 파일 업로드 시작 ===');
    
    // AWS 환경 변수 확인
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS credentials not configured');
      return NextResponse.json(
        { error: 'AWS credentials not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      console.log('파일이 제공되지 않음');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('파일 정보:', {
      name: file.name,
      size: file.size,
      type: file.type,
      folder: folder
    });

    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      console.log('파일 크기 초과:', file.size);
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // 파일 타입 확인
    if (!file.type.startsWith('image/')) {
      console.log('지원하지 않는 파일 타입:', file.type);
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const key = `${folder}/${timestamp}-${file.name}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log('S3 업로드 시작:', { bucketName, key });

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
      Metadata: {
        'upload-date': new Date().toISOString(),
        'original-name': file.name || 'unknown'
      }
    });

    const result = await s3Client.send(uploadCommand);

    console.log('S3 업로드 성공:', key);

    return NextResponse.json({
      success: true,
      fileUrl: `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${key}`,
      key,
      fileName: file.name,
      size: file.size,
    });

  } catch (error) {
    console.error('업로드 오류:', error);
    
    // 더 자세한 오류 메시지
    let errorMessage = 'Upload failed';
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        errorMessage = 'AWS credentials not configured. Please contact administrator.';
      } else if (error.message.includes('bucket')) {
        errorMessage = 'S3 bucket not found. Please contact administrator.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please contact administrator.';
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: 'No file key provided' },
        { status: 400 }
      );
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
} 