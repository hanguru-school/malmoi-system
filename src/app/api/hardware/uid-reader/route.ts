import { NextRequest, NextResponse } from 'next/server';
import { hardwareReaderManager } from '@/lib/hardware-reader';

export async function GET(request: NextRequest) {
  try {
    // 실제 하드웨어 리더 연결 및 UID 읽기
    console.log('API: 실제 하드웨어 리더 연결 시도...');
    
    const connected = await hardwareReaderManager.connect();
    if (!connected) {
      return NextResponse.json(
        { 
          success: false, 
          error: '하드웨어 리더 연결에 실패했습니다. 리더가 연결되어 있는지 확인해주세요.' 
        },
        { status: 500 }
      );
    }

    console.log('API: 하드웨어 리더 연결 성공, UID 읽기 대기 중...');
    
    // 실제 카드 UID 읽기
    const uid = await hardwareReaderManager.readUID();
    
    console.log('API: 실제 카드에서 읽은 UID:', uid);
    
    return NextResponse.json({
      success: true,
      uid: uid,
      timestamp: new Date().toISOString(),
      source: 'real_hardware_reader'
    });
    
  } catch (error) {
    console.error('API: 실제 UID 읽기 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '실제 카드 UID 읽기에 실패했습니다' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'connect':
        console.log('API: 하드웨어 리더 연결 요청...');
        const connected = await hardwareReaderManager.connect();
        return NextResponse.json({
          success: connected,
          message: connected ? '실제 하드웨어 리더 연결 성공' : '실제 하드웨어 리더 연결 실패'
        });
        
      case 'disconnect':
        console.log('API: 하드웨어 리더 연결 해제...');
        await hardwareReaderManager.disconnect();
        return NextResponse.json({
          success: true,
          message: '실제 하드웨어 리더 연결 해제'
        });
        
      case 'status':
        const isConnected = hardwareReaderManager.isConnected();
        let deviceInfo = null;
        if (isConnected) {
          try {
            deviceInfo = await hardwareReaderManager.getDeviceInfo();
          } catch (error) {
            console.error('디바이스 정보 조회 실패:', error);
          }
        }
        return NextResponse.json({
          success: true,
          connected: isConnected,
          deviceInfo: deviceInfo
        });
        
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('API: 하드웨어 리더 작업 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '실제 하드웨어 리더 작업 실패' 
      },
      { status: 500 }
    );
  }
} 