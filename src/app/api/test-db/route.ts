import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    console.log('데이터베이스 연결 테스트 시작');
    
    // 환경변수 확인
    const dbConfig = {
      host: process.env.AWS_RDS_HOST,
      port: parseInt(process.env.AWS_RDS_PORT || '5432'),
      database: process.env.AWS_RDS_DATABASE,
      user: process.env.AWS_RDS_USERNAME,
      password: process.env.AWS_RDS_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
    
    console.log('데이터베이스 설정:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      hasPassword: !!dbConfig.password,
      ssl: dbConfig.ssl
    });
    
    // 연결 테스트
    const pool = new Pool(dbConfig);
    
    try {
      const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
      console.log('데이터베이스 연결 성공:', result.rows[0]);
      
      // users 테이블 확인
      const usersResult = await pool.query('SELECT COUNT(*) as user_count FROM users');
      console.log('사용자 수:', usersResult.rows[0]);
      
      await pool.end();
      
      return NextResponse.json({
        status: 'success',
        message: '데이터베이스 연결 성공',
        data: {
          currentTime: result.rows[0].current_time,
          dbVersion: result.rows[0].db_version,
          userCount: usersResult.rows[0].user_count
        }
      });
      
    } catch (dbError) {
      console.error('데이터베이스 쿼리 오류:', dbError);
      await pool.end();
      
      return NextResponse.json({
        status: 'error',
        message: '데이터베이스 쿼리 실패',
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('데이터베이스 연결 오류:', error);
    
    return NextResponse.json({
      status: 'error',
      message: '데이터베이스 연결 실패',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 