import { NextRequest, NextResponse } from 'next/server';
import { behaviorAnalyticsManager } from '@/lib/behavior-analytics';

// 사용자 행동 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (type === 'user' && userId) {
      // 특정 사용자 행동 통계
      const behavior = await behaviorAnalyticsManager.getBehaviorStats(userId);
      const recommendations = await behaviorAnalyticsManager.generateRecommendations(userId);
      
      return NextResponse.json({
        success: true,
        data: { behavior, recommendations }
      });
    } else {
      // 전체 사용자 행동 통계
      const stats = await behaviorAnalyticsManager.getAllBehaviorStats();
      
      return NextResponse.json({
        success: true,
        data: stats
      });
    }
    
  } catch (error) {
    console.error('행동 분석 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '행동 분석 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 사용자 행동 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userType, updates } = body;

    if (!userId || !userType) {
      return NextResponse.json(
        { success: false, error: '사용자 ID와 타입이 필요합니다' },
        { status: 400 }
      );
    }

    await behaviorAnalyticsManager.updateUserBehavior(userId, userType, updates);

    return NextResponse.json({
      success: true,
      message: '사용자 행동이 업데이트되었습니다'
    });
    
  } catch (error) {
    console.error('사용자 행동 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, error: '사용자 행동 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 리마인드 큐 처리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'process_queue':
        await behaviorAnalyticsManager.processReminderQueue();
        break;
      case 'generate_recommendations':
        if (!body.userId) {
          return NextResponse.json(
            { success: false, error: '사용자 ID가 필요합니다' },
            { status: 400 }
          );
        }
        const recommendations = await behaviorAnalyticsManager.generateRecommendations(body.userId);
        return NextResponse.json({
          success: true,
          data: recommendations
        });
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: '작업이 완료되었습니다'
    });
    
  } catch (error) {
    console.error('행동 분석 작업 실패:', error);
    return NextResponse.json(
      { success: false, error: '행동 분석 작업 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 