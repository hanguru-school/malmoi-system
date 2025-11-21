import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

interface DurationSetting {
  duration: number;
  bufferMinutes: number;
}

// GET: 수강시간 / 버퍼시간 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromCookies(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // SystemSettings에서 수강시간/버퍼시간 설정 가져오기
    const durationsSetting = await prisma.systemSettings.findFirst({
      where: {
        key: "lesson_durations",
      },
    });

    const raw = durationsSetting?.value
      ? JSON.parse(durationsSetting.value as string)
      : [];

    let durations: number[] = [];
    let durationSettings: DurationSetting[] = [];

    if (Array.isArray(raw)) {
      // 이전 버전: 단순 숫자 배열만 저장된 경우
      durations = raw.filter((d) => typeof d === "number");
      durationSettings = durations.map((d) => ({
        duration: d,
        bufferMinutes: 0,
      }));
    } else if (raw && typeof raw === "object") {
      const rawDurations = Array.isArray((raw as any).durations)
        ? (raw as any).durations
        : [];
      const rawSettings = Array.isArray((raw as any).settings)
        ? (raw as any).settings
        : [];

      durations = rawDurations.filter((d: any) => typeof d === "number");

      durationSettings = durations.map((d: number) => {
        const found = rawSettings.find(
          (s: any) => typeof s?.duration === "number" && s.duration === d,
        );
        return {
          duration: d,
          bufferMinutes:
            typeof found?.bufferMinutes === "number" && found.bufferMinutes >= 0
              ? found.bufferMinutes
              : 0,
        };
      });
    }

    return NextResponse.json({
      success: true,
      durations,
      durationSettings,
    });
  } catch (error) {
    console.error("수강시간 목록 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 수강시간 / 버퍼시간 추가·수정
export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromCookies(request);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { durations, durationSettings } = body as {
      durations?: unknown;
      durationSettings?: unknown;
    };

    let finalDurations: number[] = [];
    let finalSettings: DurationSetting[] = [];

    if (Array.isArray(durationSettings)) {
      // 새로운 형식: duration + bufferMinutes 함께 전달
      const parsed: DurationSetting[] = (durationSettings as any[])
        .map((item) => ({
          duration: Number(item?.duration) || 0,
          bufferMinutes:
            typeof item?.bufferMinutes === "number"
              ? Math.max(0, Math.round(item.bufferMinutes))
              : 0,
        }))
        .filter((d) => d.duration > 0);

      if (parsed.length === 0) {
        return NextResponse.json(
          { success: false, message: "유효한 수강시간 설정이 없습니다." },
          { status: 400 },
        );
      }

      // duration 기준으로 정렬 및 중복 제거
      const byDuration = new Map<number, DurationSetting>();
      for (const d of parsed) {
        byDuration.set(d.duration, d);
      }
      finalSettings = Array.from(byDuration.values()).sort(
        (a, b) => a.duration - b.duration,
      );
      finalDurations = finalSettings.map((d) => d.duration);
    } else if (Array.isArray(durations)) {
      // 이전 형식: duration 숫자 배열만 전달된 경우, 버퍼는 0으로 저장
      const parsed = (durations as any[])
        .map((d) => Number(d) || 0)
        .filter((d) => d > 0);

      if (parsed.length === 0) {
        return NextResponse.json(
          { success: false, message: "유효한 수강시간 목록이 없습니다." },
          { status: 400 },
        );
      }

      const unique = Array.from(new Set(parsed)).sort((a, b) => a - b);
      finalDurations = unique;
      finalSettings = unique.map((d) => ({ duration: d, bufferMinutes: 0 }));
    } else {
      return NextResponse.json(
        { success: false, message: "수강시간 목록이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // SystemSettings에 저장 (durations + settings 함께 저장)
    await prisma.systemSettings.upsert({
      where: {
        key: "lesson_durations",
      },
      update: {
        value: JSON.stringify({
          durations: finalDurations,
          settings: finalSettings,
        }),
        updatedAt: new Date(),
      },
      create: {
        key: "lesson_durations",
        value: JSON.stringify({
          durations: finalDurations,
          settings: finalSettings,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "수강시간 및 버퍼시간 설정이 저장되었습니다.",
      durations: finalDurations,
      durationSettings: finalSettings,
    });
  } catch (error) {
    console.error("수강시간 저장 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

