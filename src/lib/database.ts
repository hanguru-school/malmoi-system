import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// 환경변수에서 데이터베이스 연결 정보 추출
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
    try {
      // DATABASE_URL 형식: postgresql://username:password@host:port/database
      const url = new URL(databaseUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1), // 첫 번째 '/' 제거
        user: url.username,
        password: url.password,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      };
    } catch (error) {
      console.error('DATABASE_URL 파싱 오류:', error);
    }
  }
  
  // 개별 환경변수 사용
  return {
    host: process.env.AWS_RDS_HOST || 'localhost',
    port: parseInt(process.env.AWS_RDS_PORT || '5432'),
    database: process.env.AWS_RDS_DATABASE || 'malmoi_system',
    user: process.env.AWS_RDS_USERNAME || 'postgres',
    password: process.env.AWS_RDS_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
};

// 데이터베이스 연결 풀 생성
const pool = new Pool(getDatabaseConfig());

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL 데이터베이스에 연결되었습니다.');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 오류:', err);
});

// 연결 풀 상태 확인
console.log('데이터베이스 설정:', {
  host: getDatabaseConfig().host,
  port: getDatabaseConfig().port,
  database: getDatabaseConfig().database,
  user: getDatabaseConfig().user,
  hasPassword: !!getDatabaseConfig().password,
  ssl: getDatabaseConfig().ssl
});

// 사용자 인증 함수
export async function authenticateUser(email: string, password: string) {
  try {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.password,
        u.role,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.email = $1
    `;
    
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    
    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // 비밀번호 제거 후 반환
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('사용자 인증 오류:', error);
    throw error;
  }
}

// 사용자 생성 함수
export async function createUser(userData: {
  email: string;
  name: string;
  password: string;
  role: string;
}) {
  try {
    const query = `
      INSERT INTO users (email, name, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, email, name, role, created_at, updated_at
    `;
    
    const result = await pool.query(query, [
      userData.email,
      userData.name,
      userData.password,
      userData.role
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    throw error;
  }
}

// 사용자 조회 함수
export async function getUserById(id: string) {
  try {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    throw error;
  }
}

// 데이터베이스 연결 종료
export async function closeDatabase() {
  await pool.end();
}

export default pool; 