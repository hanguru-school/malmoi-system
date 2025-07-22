import { NextRequest, NextResponse } from 'next/server';
import { automationSystem } from '@/lib/automation-system';

// 자동화 규칙 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'rules':
        const rules = automationSystem.getRules();
        return NextResponse.json({
          success: true,
          data: rules
        });
      
      case 'logs':
        const limit = parseInt(searchParams.get('limit') || '100');
        const logs = automationSystem.getLogs(limit);
        return NextResponse.json({
          success: true,
          data: logs
        });
      
      case 'message_history':
        const recipientId = searchParams.get('recipientId') || undefined;
        const messages = automationSystem.getMessageHistory(recipientId);
        return NextResponse.json({
          success: true,
          data: messages
        });
      
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 조회 타입입니다' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('자동화 데이터 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '자동화 데이터 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 자동화 규칙 관리
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ruleId, rule, updates } = body;

    switch (action) {
      case 'add_rule':
        if (!rule) {
          return NextResponse.json(
            { success: false, error: '규칙 데이터가 필요합니다' },
            { status: 400 }
          );
        }
        automationSystem.addRule(rule);
        return NextResponse.json({
          success: true,
          message: '자동화 규칙이 추가되었습니다'
        });
      
      case 'update_rule':
        if (!ruleId || !updates) {
          return NextResponse.json(
            { success: false, error: '규칙 ID와 업데이트 데이터가 필요합니다' },
            { status: 400 }
          );
        }
        automationSystem.updateRule(ruleId, updates);
        return NextResponse.json({
          success: true,
          message: '자동화 규칙이 업데이트되었습니다'
        });
      
      case 'delete_rule':
        if (!ruleId) {
          return NextResponse.json(
            { success: false, error: '규칙 ID가 필요합니다' },
            { status: 400 }
          );
        }
        automationSystem.deleteRule(ruleId);
        return NextResponse.json({
          success: true,
          message: '자동화 규칙이 삭제되었습니다'
        });
      
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('자동화 규칙 관리 실패:', error);
    return NextResponse.json(
      { success: false, error: '자동화 규칙 관리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 자동화 실행 및 테스트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ruleId, testData } = body;

    switch (action) {
      case 'execute_rules':
        await automationSystem.executeRules();
        return NextResponse.json({
          success: true,
          message: '자동화 규칙이 실행되었습니다'
        });
      
      case 'process_queue':
        await automationSystem.processMessageQueue();
        return NextResponse.json({
          success: true,
          message: '메시지 큐가 처리되었습니다'
        });
      
      case 'test_rule':
        if (!ruleId) {
          return NextResponse.json(
            { success: false, error: '규칙 ID가 필요합니다' },
            { status: 400 }
          );
        }
        
        // 테스트 메시지 발송
        const testMessage = {
          id: 'test_message',
          ruleId,
          recipientId: testData?.recipientId || 'test_user',
          recipientType: testData?.recipientType || 'student',
          message: testData?.message || '테스트 메시지입니다.',
          channels: testData?.channels || ['email'],
          status: 'pending' as const,
          scheduledAt: new Date(),
          retryCount: 0
        };
        
        // 실제 발송 대신 로그만 기록
        console.log('테스트 메시지:', testMessage);
        
        return NextResponse.json({
          success: true,
          message: '테스트 메시지가 발송되었습니다',
          data: testMessage
        });
      
      case 'send_test_message':
        const { recipientId, recipientType, message, channels } = body;
        
        if (!recipientId || !message) {
          return NextResponse.json(
            { success: false, error: '수신자 ID와 메시지가 필요합니다' },
            { status: 400 }
          );
        }
        
        // 테스트 메시지 발송
        const testAutomationMessage: Record<string, unknown> = {
          id: 'test_message',
          ruleId: 'test_rule',
          recipientId,
          recipientType: recipientType || 'student',
          message,
          channels: channels || ['email'],
          status: 'pending' as const,
          scheduledAt: new Date(),
          retryCount: 0
        };
        
        // 실제 발송 로직 (테스트용)
        try {
          for (const channel of testAutomationMessage.channels) {
            switch (channel) {
              case 'line':
                console.log(`LINE 메시지 발송: ${recipientId} - ${message}`);
                break;
              case 'email':
                console.log(`이메일 발송: ${recipientId} - ${message}`);
                break;
              case 'push':
                console.log(`푸시 알림 발송: ${recipientId} - ${message}`);
                break;
            }
          }
          
          testAutomationMessage.status = 'sent';
          testAutomationMessage.sentAt = new Date();
        } catch (error) {
          testAutomationMessage.status = 'failed';
          throw error;
        }
        
        return NextResponse.json({
          success: true,
          message: '테스트 메시지가 발송되었습니다',
          data: testAutomationMessage
        });
      
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('자동화 실행 실패:', error);
    return NextResponse.json(
      { success: false, error: '자동화 실행 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 자동화 데이터 내보내기/가져오기
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'export':
        const exportedData = automationSystem.exportData();
        return NextResponse.json({
          success: true,
          data: exportedData
        });
      
      case 'import':
        if (!data) {
          return NextResponse.json(
            { success: false, error: '가져올 데이터가 필요합니다' },
            { status: 400 }
          );
        }
        
        const success = automationSystem.importData(data);
        if (success) {
          return NextResponse.json({
            success: true,
            message: '자동화 데이터가 가져와졌습니다'
          });
        } else {
          return NextResponse.json(
            { success: false, error: '데이터 가져오기에 실패했습니다' },
            { status: 400 }
          );
        }
      
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('자동화 데이터 관리 실패:', error);
    return NextResponse.json(
      { success: false, error: '자동화 데이터 관리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 