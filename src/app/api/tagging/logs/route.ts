import { NextRequest, NextResponse } from 'next/server';

// 임시 태깅 이력 (실제로는 데이터베이스에서 조회)
const mockLogs = [
  {
    uid: 'ABCD1234',
    userName: '김학생',
    eventType: 'attendance' as const,
    timestamp: '2024-07-19T09:00:00Z'
  },
  {
    uid: 'EFGH5678',
    userName: '이선생님',
    eventType: 'attendance' as const,
    timestamp: '2024-07-19T08:30:00Z'
  },
  {
    uid: 'IJKL9012',
    userName: '박관리자',
    eventType: 'visit' as const,
    timestamp: '2024-07-19T10:15:00Z'
  },
  {
    uid: 'ABCD1234',
    userName: '김학생',
    eventType: 'checkout' as const,
    timestamp: '2024-07-19T18:00:00Z'
  },
  {
    uid: 'EFGH5678',
    userName: '이선생님',
    eventType: 'checkout' as const,
    timestamp: '2024-07-19T17:30:00Z'
  },
  {
    uid: 'MNOP3456',
    userName: '최학생',
    eventType: 'attendance' as const,
    timestamp: '2024-07-19T09:15:00Z'
  },
  {
    uid: 'QRST7890',
    userName: '정선생님',
    eventType: 'visit' as const,
    timestamp: '2024-07-19T14:20:00Z'
  },
  {
    uid: 'UVWX1234',
    userName: '한학생',
    eventType: 'attendance' as const,
    timestamp: '2024-07-19T08:45:00Z'
  },
  {
    uid: 'YZAB5678',
    userName: '윤선생님',
    eventType: 'checkout' as const,
    timestamp: '2024-07-19T19:00:00Z'
  },
  {
    uid: 'CDEF9012',
    userName: '임학생',
    eventType: 'visit' as const,
    timestamp: '2024-07-19T16:30:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const filterDate = searchParams.get('filterDate') || '';
    const filterType = searchParams.get('filterType') || '';
    
    // 필터링 적용
    let filteredLogs = [...mockLogs];
    
    // 검색 필터
    if (search) {
      filteredLogs = filteredLogs.filter(log => 
        log.uid.toLowerCase().includes(search.toLowerCase()) ||
        log.userName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // 날짜 필터
    if (filterDate) {
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate === filterDate;
      });
    }
    
    // 이벤트 타입 필터
    if (filterType) {
      filteredLogs = filteredLogs.filter(log => log.eventType === filterType);
    }
    
    // 페이지네이션 계산
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // 전체 로그 수
    const total = filteredLogs.length;
    
    // 현재 페이지의 로그만 반환
    const logs = filteredLogs.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error('Error fetching tagging logs:', error);
    return NextResponse.json(
      { success: false, error: '이력 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 