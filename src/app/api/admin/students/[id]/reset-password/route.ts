import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromCookies(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "학생을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!student.user) {
      return NextResponse.json(
        { success: false, error: "학생 계정이 없습니다." },
        { status: 404 }
      );
    }

    // 임시 패스워드 생성 (8자리 영문+숫자)
    const temporaryPassword = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // 패스워드 해시화
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // 사용자 패스워드 업데이트
    await prisma.user.update({
      where: { id: student.user.id },
      data: {
        password: hashedPassword,
        isFirstLogin: true, // 로그인 후 패스워드 변경 필수 (isFirstLogin을 사용)
      },
    });

    // 이메일 전송 (실제 이메일 전송 기능이 있으면 사용)
    const email = student.user.email || student.email;
    if (email) {
      try {
        // 이메일 전송 API 호출
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email,
            subject: '임시 패스워드 안내',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">임시 패스워드 안내</h2>
                <p>안녕하세요, ${student.name || '학생'}님.</p>
                <p>관리자가 요청한 임시 패스워드가 발급되었습니다.</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2563eb;">
                    임시 패스워드: <span style="letter-spacing: 2px;">${temporaryPassword}</span>
                  </p>
                </div>
                <p>로그인 후 반드시 패스워드를 변경해주세요.</p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  이 이메일은 자동으로 발송되었습니다.
                </p>
              </div>
            `,
          }),
        });
      } catch (emailError) {
        console.error('이메일 전송 오류:', emailError);
        // 이메일 전송 실패해도 패스워드는 재설정되었으므로 계속 진행
      }
    }

    return NextResponse.json({
      success: true,
      message: "임시 패스워드가 이메일로 전송되었습니다.",
      temporaryPassword, // 개발/테스트용으로 임시 패스워드 반환
    });
  } catch (error) {
    console.error("패스워드 재설정 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

