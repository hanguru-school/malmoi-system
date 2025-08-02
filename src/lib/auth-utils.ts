// Cognito-based Authentication Utilities for MalMoi System

import { NextRequest, NextResponse } from "next/server";
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
import jwt from "jsonwebtoken";

// 타입 정의
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message: string;
}

// Cognito 클라이언트 초기화
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
});

// JWT 토큰 생성
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "fallback-secret",
    { expiresIn: "24h" }
  );
}

// JWT 토큰 검증
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as AuthUser;
    return decoded;
  } catch (error) {
    console.error("토큰 검증 실패:", error);
    return null;
  }
}

// 사용자 인증 미들웨어
export function createAuthMiddleware() {
  return (req: NextRequest, res: NextResponse, next: () => void) => {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    // 사용자 정보를 요청 객체에 추가
    (req as any).user = user;
    next();
  };
}

// Cognito 콜백 처리
export async function handleCognitoCallback(code: string, state: string): Promise<AuthResponse> {
  try {
    // 실제로는 Cognito에서 토큰을 교환해야 함
    const user: AuthUser = {
      id: "user-id",
      email: "user@example.com",
      name: "사용자",
      role: "student",
    };

    const token = generateToken(user);

    return {
      success: true,
      user,
      token,
      message: "인증 성공",
    };
  } catch (error) {
    console.error("Cognito 콜백 처리 오류:", error);
    return {
      success: false,
      message: "인증 처리 중 오류가 발생했습니다.",
    };
  }
}

// 인증 성공 응답 생성
export function createAuthSuccessResponse(user: AuthUser, token: string): NextResponse {
  return NextResponse.json({
    success: true,
    user,
    token,
    message: "인증 성공",
  });
}

// 쿠키에서 세션 가져오기
export function getSessionFromCookies(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return null;
    }
    return verifyToken(token);
  } catch (error) {
    console.error("세션 가져오기 오류:", error);
    return null;
  }
}

// Cognito 로그인
export async function cognitoLogin(email: string, password: string): Promise<AuthResponse> {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);
    
    if (response.AuthenticationResult?.AccessToken) {
      // 사용자 정보 가져오기 (실제로는 Cognito에서 사용자 정보를 가져와야 함)
      const user: AuthUser = {
        id: "user-id",
        email,
        name: "사용자",
        role: "student",
      };

      const token = generateToken(user);

      return {
        success: true,
        user,
        token,
        message: "로그인 성공",
      };
    }

    return {
      success: false,
      message: "로그인 실패",
    };
  } catch (error) {
    console.error("Cognito 로그인 오류:", error);
    return {
      success: false,
      message: "로그인 중 오류가 발생했습니다.",
    };
  }
}

// Cognito 회원가입
export async function cognitoSignUp(email: string, password: string, name: string): Promise<AuthResponse> {
  try {
    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "name",
          Value: name,
        },
      ],
    });

    await cognitoClient.send(command);

    return {
      success: true,
      message: "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.",
    };
  } catch (error) {
    console.error("Cognito 회원가입 오류:", error);
    return {
      success: false,
      message: "회원가입 중 오류가 발생했습니다.",
    };
  }
}

// Cognito 회원가입 확인
export async function cognitoConfirmSignUp(email: string, code: string): Promise<AuthResponse> {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    await cognitoClient.send(command);

    return {
      success: true,
      message: "회원가입이 확인되었습니다.",
    };
  } catch (error) {
    console.error("Cognito 회원가입 확인 오류:", error);
    return {
      success: false,
      message: "회원가입 확인 중 오류가 발생했습니다.",
    };
  }
}

// 비밀번호 재설정 요청
export async function cognitoForgotPassword(email: string): Promise<AuthResponse> {
  try {
    const command = new ForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
    });

    await cognitoClient.send(command);

    return {
      success: true,
      message: "비밀번호 재설정 이메일이 발송되었습니다.",
    };
  } catch (error) {
    console.error("Cognito 비밀번호 재설정 요청 오류:", error);
    return {
      success: false,
      message: "비밀번호 재설정 요청 중 오류가 발생했습니다.",
    };
  }
}

// 비밀번호 재설정 확인
export async function cognitoConfirmForgotPassword(email: string, code: string, newPassword: string): Promise<AuthResponse> {
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await cognitoClient.send(command);

    return {
      success: true,
      message: "비밀번호가 재설정되었습니다.",
    };
  } catch (error) {
    console.error("Cognito 비밀번호 재설정 확인 오류:", error);
    return {
      success: false,
      message: "비밀번호 재설정 확인 중 오류가 발생했습니다.",
    };
  }
}
