// Environment Variables Validator for MalMoi System

interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  AWS_RDS_HOST: string;
  AWS_RDS_PORT: string;
  AWS_RDS_DATABASE: string;
  AWS_RDS_USERNAME: string;
  AWS_RDS_PASSWORD: string;
  
  // AWS
  AWS_REGION: string;
  AWS_S3_BUCKET: string;
  
  // Cognito (Server-side)
  COGNITO_REGION: string;
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_CLIENT_SECRET: string;
  COGNITO_DOMAIN: string;
  COGNITO_RESPONSE_TYPE: string;
  
  // Cognito (Client-side)
  NEXT_PUBLIC_COGNITO_REGION: string;
  NEXT_PUBLIC_COGNITO_USER_POOL_ID: string;
  NEXT_PUBLIC_COGNITO_CLIENT_ID: string;
  NEXT_PUBLIC_COGNITO_DOMAIN: string;
  NEXT_PUBLIC_COGNITO_CALLBACK_URL: string;
  NEXT_PUBLIC_COGNITO_SIGNOUT_URL: string;
  NEXT_PUBLIC_COGNITO_OAUTH_SCOPES: string;
  NEXT_PUBLIC_COGNITO_RESPONSE_TYPE: string;
  
  // Authentication
  JWT_SECRET: string;
  SESSION_SECRET: string;
  AUTH_BASE_URL: string;
  
  // Security
  CORS_ORIGIN: string;
  CSRF_SECRET: string;
  
  // Environment
  NODE_ENV: string;
  NEXT_PUBLIC_NODE_ENV: string;
}

interface ValidationResult {
  isValid: boolean;
  missingVars: string[];
  invalidVars: string[];
  warnings: string[];
}

/**
 * 환경 변수 검증
 */
export function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    missingVars: [],
    invalidVars: [],
    warnings: []
  };

  // 필수 환경 변수 목록
  const requiredVars = [
    'DATABASE_URL',
    'AWS_RDS_HOST',
    'AWS_RDS_PORT',
    'AWS_RDS_DATABASE',
    'AWS_RDS_USERNAME',
    'AWS_RDS_PASSWORD',
    'AWS_REGION',
    'AWS_S3_BUCKET',
    'COGNITO_REGION',
    'COGNITO_USER_POOL_ID',
    'COGNITO_CLIENT_ID',
    'COGNITO_CLIENT_SECRET',
    'COGNITO_DOMAIN',
    'COGNITO_RESPONSE_TYPE',
    'NEXT_PUBLIC_COGNITO_REGION',
    'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
    'NEXT_PUBLIC_COGNITO_CLIENT_ID',
    'NEXT_PUBLIC_COGNITO_DOMAIN',
    'NEXT_PUBLIC_COGNITO_CALLBACK_URL',
    'NEXT_PUBLIC_COGNITO_SIGNOUT_URL',
    'NEXT_PUBLIC_COGNITO_OAUTH_SCOPES',
    'NEXT_PUBLIC_COGNITO_RESPONSE_TYPE',
    'JWT_SECRET',
    'SESSION_SECRET',
    'AUTH_BASE_URL',
    'CORS_ORIGIN',
    'CSRF_SECRET',
    'NODE_ENV',
    'NEXT_PUBLIC_NODE_ENV'
  ];

  // 누락된 환경 변수 확인
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      result.missingVars.push(varName);
      result.isValid = false;
    }
  }

  // 환경 변수 값 검증
  const validations = [
    {
      name: 'DATABASE_URL',
      validator: (value: string) => value.startsWith('postgresql://'),
      message: 'DATABASE_URL must start with postgresql://'
    },
    {
      name: 'COGNITO_DOMAIN',
      validator: (value: string) => value.startsWith('https://'),
      message: 'COGNITO_DOMAIN must start with https://'
    },
    {
      name: 'NEXT_PUBLIC_COGNITO_DOMAIN',
      validator: (value: string) => value.startsWith('https://'),
      message: 'NEXT_PUBLIC_COGNITO_DOMAIN must start with https://'
    },
    {
      name: 'NEXT_PUBLIC_COGNITO_CALLBACK_URL',
      validator: (value: string) => value.startsWith('https://'),
      message: 'NEXT_PUBLIC_COGNITO_CALLBACK_URL must start with https://'
    },
    {
      name: 'NEXT_PUBLIC_COGNITO_SIGNOUT_URL',
      validator: (value: string) => value.startsWith('https://'),
      message: 'NEXT_PUBLIC_COGNITO_SIGNOUT_URL must start with https://'
    },
    {
      name: 'AUTH_BASE_URL',
      validator: (value: string) => value.startsWith('https://'),
      message: 'AUTH_BASE_URL must start with https://'
    },
    {
      name: 'AWS_REGION',
      validator: (value: string) => value === 'ap-northeast-1',
      message: 'AWS_REGION must be ap-northeast-1'
    },
    {
      name: 'COGNITO_REGION',
      validator: (value: string) => value === 'ap-northeast-1',
      message: 'COGNITO_REGION must be ap-northeast-1'
    },
    {
      name: 'NEXT_PUBLIC_COGNITO_REGION',
      validator: (value: string) => value === 'ap-northeast-1',
      message: 'NEXT_PUBLIC_COGNITO_REGION must be ap-northeast-1'
    },
    {
      name: 'COGNITO_USER_POOL_ID',
      validator: (value: string) => value === 'ap-northeast-1_ojlXfDMDm',
      message: 'COGNITO_USER_POOL_ID must be ap-northeast-1_ojlXfDMDm'
    },
    {
      name: 'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
      validator: (value: string) => value === 'ap-northeast-1_ojlXfDMDm',
      message: 'NEXT_PUBLIC_COGNITO_USER_POOL_ID must be ap-northeast-1_ojlXfDMDm'
    },
    {
      name: 'COGNITO_CLIENT_ID',
      validator: (value: string) => value === '4bdn0n9r92huqpcs21e0th1nve',
      message: 'COGNITO_CLIENT_ID must be 4bdn0n9r92huqpcs21e0th1nve'
    },
    {
      name: 'NEXT_PUBLIC_COGNITO_CLIENT_ID',
      validator: (value: string) => value === '4bdn0n9r92huqpcs21e0th1nve',
      message: 'NEXT_PUBLIC_COGNITO_CLIENT_ID must be 4bdn0n9r92huqpcs21e0th1nve'
    },
    {
      name: 'COGNITO_RESPONSE_TYPE',
      validator: (value: string) => value === 'code',
      message: 'COGNITO_RESPONSE_TYPE must be code'
    },
    {
      name: 'NEXT_PUBLIC_COGNITO_RESPONSE_TYPE',
      validator: (value: string) => value === 'code',
      message: 'NEXT_PUBLIC_COGNITO_RESPONSE_TYPE must be code'
    },
    {
      name: 'NODE_ENV',
      validator: (value: string) => ['development', 'production'].includes(value),
      message: 'NODE_ENV must be development or production'
    },
    {
      name: 'NEXT_PUBLIC_NODE_ENV',
      validator: (value: string) => ['development', 'production'].includes(value),
      message: 'NEXT_PUBLIC_NODE_ENV must be development or production'
    }
  ];

  // 값 검증
  for (const validation of validations) {
    const value = process.env[validation.name];
    if (value && !validation.validator(value)) {
      result.invalidVars.push(`${validation.name}: ${validation.message}`);
      result.isValid = false;
    }
  }

  // 경고 확인
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_BASE_URL?.includes('localhost')) {
    result.warnings.push('AUTH_BASE_URL should not contain localhost in production');
  }

  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_COGNITO_CALLBACK_URL?.includes('localhost')) {
    result.warnings.push('NEXT_PUBLIC_COGNITO_CALLBACK_URL should not contain localhost in production');
  }

  return result;
}

/**
 * 환경 변수 로그 출력
 */
export function logEnvironmentStatus(): void {
  const result = validateEnvironment();
  
  console.log('=== Environment Variables Validation ===');
  console.log(`Valid: ${result.isValid ? '✅' : '❌'}`);
  
  if (result.missingVars.length > 0) {
    console.log('❌ Missing Variables:');
    result.missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }
  
  if (result.invalidVars.length > 0) {
    console.log('❌ Invalid Variables:');
    result.invalidVars.forEach(error => {
      console.log(`   - ${error}`);
    });
  }
  
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }
  
  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ All environment variables are properly configured!');
  }
  
  console.log('=====================================');
}

/**
 * 환경 변수 설정 가져오기
 */
export function getEnvironmentConfig(): Partial<EnvironmentConfig> {
  return {
    DATABASE_URL: process.env.DATABASE_URL || '',
    AWS_RDS_HOST: process.env.AWS_RDS_HOST || '',
    AWS_RDS_PORT: process.env.AWS_RDS_PORT || '',
    AWS_RDS_DATABASE: process.env.AWS_RDS_DATABASE || '',
    AWS_RDS_USERNAME: process.env.AWS_RDS_USERNAME || '',
    AWS_RDS_PASSWORD: process.env.AWS_RDS_PASSWORD || '',
    AWS_REGION: process.env.AWS_REGION || '',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
    COGNITO_REGION: process.env.COGNITO_REGION || '',
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || '',
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || '',
    COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET || '',
    COGNITO_DOMAIN: process.env.COGNITO_DOMAIN || '',
    COGNITO_RESPONSE_TYPE: process.env.COGNITO_RESPONSE_TYPE || '',
    NEXT_PUBLIC_COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION || '',
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
    NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
    NEXT_PUBLIC_COGNITO_CALLBACK_URL: process.env.NEXT_PUBLIC_COGNITO_CALLBACK_URL || '',
    NEXT_PUBLIC_COGNITO_SIGNOUT_URL: process.env.NEXT_PUBLIC_COGNITO_SIGNOUT_URL || '',
    NEXT_PUBLIC_COGNITO_OAUTH_SCOPES: process.env.NEXT_PUBLIC_COGNITO_OAUTH_SCOPES || '',
    NEXT_PUBLIC_COGNITO_RESPONSE_TYPE: process.env.NEXT_PUBLIC_COGNITO_RESPONSE_TYPE || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
    SESSION_SECRET: process.env.SESSION_SECRET || '',
    AUTH_BASE_URL: process.env.AUTH_BASE_URL || '',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '',
    CSRF_SECRET: process.env.CSRF_SECRET || '',
    NODE_ENV: process.env.NODE_ENV || '',
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || ''
  };
}

// 초기화 시 환경 변수 상태 로그
if (typeof window === 'undefined') {
  logEnvironmentStatus();
} 