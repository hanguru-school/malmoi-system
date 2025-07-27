import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { handleApiError } from '@/lib/api-utils';
import jwt from 'jsonwebtoken';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: '이메일과 비밀번호를 입력하세요.' }, { status: 400 });
    }

    // AWS Cognito 로그인 시도
    const authResult = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_CLIENT_ID!,
        AuthParameters: { USERNAME: email, PASSWORD: password },
      })
    );

    // JWT 발급 (임시 토큰)
    const token = jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    return NextResponse.json({ success: true, token, authResult });
  } catch (error) {
    return handleApiError(error, 'POST /api/auth/login');
  }
} 