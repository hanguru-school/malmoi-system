-- 관리자 사용자 생성 (비밀번호 해시 포함)
-- 비밀번호: Alfl1204! (bcrypt로 해시화됨)

INSERT INTO users (email, name, role, cognito_user_id, password_hash, created_at, updated_at) 
VALUES (
  'hanguru.school@gmail.com',
  '관리자',
  'admin',
  'simple_admin_001',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 'Alfl1204!'의 bcrypt 해시
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW(); 