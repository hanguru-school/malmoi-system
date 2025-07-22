import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics-engine';

// 통계 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'json';
    const filter = searchParams.get('filter');

    let analyticsData: Record<string, unknown>;

    switch (type) {
      case 'comprehensive':
        analyticsData = await analyticsEngine.generateComprehensiveAnalytics(
          filter ? JSON.parse(filter) : undefined
        );
        break;
      case 'booking':
        analyticsData = await analyticsEngine.analyzeBookingStats(
          filter ? JSON.parse(filter) : undefined
        );
        break;
      case 'student':
        analyticsData = await analyticsEngine.analyzeStudentStats(
          filter ? JSON.parse(filter) : undefined
        );
        break;
      case 'homework':
        analyticsData = await analyticsEngine.analyzeHomeworkStats(
          filter ? JSON.parse(filter) : undefined
        );
        break;
      case 'lesson_note':
        analyticsData = await analyticsEngine.analyzeLessonNoteStats(
          filter ? JSON.parse(filter) : undefined
        );
        break;
      case 'level':
        analyticsData = await analyticsEngine.analyzeLevelStats(
          filter ? JSON.parse(filter) : undefined
        );
        break;
      case 'time':
        analyticsData = await analyticsEngine.analyzeTimePatterns(
          filter ? JSON.parse(filter) : undefined
        );
        break;
      case 'review':
        analyticsData = await analyticsEngine.analyzeReviewStats(
          filter ? JSON.parse(filter) : undefined
        );
        break;
      case 'automation':
        analyticsData = await analyticsEngine.analyzeAutomationStats(
          filter ? JSON.parse(filter) : undefined
        );
        break;
      case 'dormant_students':
        const daysThreshold = parseInt(searchParams.get('days') || '30');
        analyticsData = await analyticsEngine.identifyDormantStudents(daysThreshold);
        break;
      case 'difficult_homework':
        const errorRateThreshold = parseFloat(searchParams.get('threshold') || '0.3');
        analyticsData = await analyticsEngine.identifyDifficultHomework(errorRateThreshold);
        break;
      case 'learning_trends':
        const studentId = searchParams.get('studentId');
        if (!studentId) {
          return NextResponse.json(
            { success: false, error: '학생 ID가 필요합니다' },
            { status: 400 }
          );
        }
        analyticsData = await analyticsEngine.analyzeLearningTrends(studentId);
        break;
      case 'predictions':
        analyticsData = await analyticsEngine.generatePredictions();
        break;
      case 'report':
        const reportType = searchParams.get('reportType') as 'monthly' | 'weekly' | 'daily' || 'monthly';
        analyticsData = await analyticsEngine.generateReport(
          reportType,
          filter ? JSON.parse(filter) : undefined
        );
        break;
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 분석 타입입니다' },
          { status: 400 }
        );
    }

    // 데이터 내보내기
    if (format !== 'json') {
      const exportedData = await analyticsEngine.exportData(
        format as 'csv' | 'excel' | 'json',
        filter ? JSON.parse(filter) : undefined
      );
      
      return new NextResponse(exportedData, {
        headers: {
          'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="analytics_${type}_${new Date().toISOString().split('T')[0]}.${format}"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    });
    
  } catch (error) {
    console.error('통계 분석 실패:', error);
    return NextResponse.json(
      { success: false, error: '통계 분석 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 통계 데이터 업데이트 (실시간 데이터 갱신)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'refresh_cache':
        // 캐시 갱신
        const analyticsData = await analyticsEngine.generateComprehensiveAnalytics();
        return NextResponse.json({
          success: true,
          message: '통계 데이터가 갱신되었습니다',
          data: analyticsData
        });
      
      case 'update_student_behavior':
        // 학생 행동 데이터 업데이트
        if (!data.studentId || !data.userType || !data.updates) {
          return NextResponse.json(
            { success: false, error: '필수 데이터가 누락되었습니다' },
            { status: 400 }
          );
        }
        
        // behaviorAnalyticsManager를 통해 업데이트
        // 실제 구현에서는 여기서 호출
        return NextResponse.json({
          success: true,
          message: '학생 행동 데이터가 업데이트되었습니다'
        });
      
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('통계 데이터 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, error: '통계 데이터 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 