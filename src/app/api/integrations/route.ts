import { NextRequest, NextResponse } from 'next/server';
import { externalIntegrationManager } from '@/lib/external-integrations';

// 외부 시스템 설정 조회
export async function GET() {
  try {
    const config = externalIntegrationManager.getConfig();
    
    return NextResponse.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('외부 시스템 설정 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '외부 시스템 설정 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 외부 시스템 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { simplyBook, line, square, googleCalendar, uidReader } = body;

    // 설정 업데이트
    externalIntegrationManager.updateConfig({
      simplyBook,
      line,
      square,
      googleCalendar,
      uidReader
    });

    return NextResponse.json({
      success: true,
      message: '외부 시스템 설정이 업데이트되었습니다'
    });
    
  } catch (error) {
    console.error('외부 시스템 설정 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, error: '외부 시스템 설정 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 외부 시스템 연동 테스트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { system, action, data } = body;

    let result: Record<string, unknown> = null;

    switch (system) {
      case 'line':
        if (action === 'send_message') {
          result = await externalIntegrationManager.sendLineMessage(data.userId, data.message);
        }
        break;
      case 'square':
        if (action === 'process_payment') {
          result = await externalIntegrationManager.processSquarePayment(data);
        }
        break;
      case 'simplybook':
        if (action === 'sync_booking') {
          result = await externalIntegrationManager.syncWithSimplyBook(data);
        }
        break;
      case 'uid_reader':
        if (action === 'process_tag') {
          result = await externalIntegrationManager.processUIDTagEvent(data.uid, data.location);
        }
        break;
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 시스템입니다' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: '연동 테스트가 완료되었습니다'
    });
    
  } catch (error) {
    console.error('외부 시스템 연동 테스트 실패:', error);
    return NextResponse.json(
      { success: false, error: '외부 시스템 연동 테스트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 