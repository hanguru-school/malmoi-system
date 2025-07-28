import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-utils';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });

    const response = await client.send(command);

    return NextResponse.json({ success: true, session: response.AuthenticationResult });
  } catch (error: any) {
    return handleApiError(error, error.message || '로그인 실패');
  }
} 