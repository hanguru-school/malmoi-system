-- LINE 연동을 위한 사용자 테이블 스키마 업데이트

-- 기존 users 테이블에 LINE 관련 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_method ENUM('email', 'line') DEFAULT 'email';
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_token_expires_at TIMESTAMP;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_line_id ON users(line_id);
CREATE INDEX IF NOT EXISTS idx_users_login_method ON users(login_method);

-- LINE 연동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS line_integration_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'login', 'register', 'message_sent', 'message_received'
    line_user_id VARCHAR(255),
    message TEXT,
    status VARCHAR(50) NOT NULL, -- 'success', 'error', 'pending'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LINE 메시지 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS line_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    line_user_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'sticker', etc.
    message_content TEXT,
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent' -- 'sent', 'delivered', 'read', 'failed'
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_line_messages_user_id ON line_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_line_messages_line_user_id ON line_messages(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_messages_timestamp ON line_messages(timestamp);

-- LINE 연동 설정 테이블 생성
CREATE TABLE IF NOT EXISTS line_integration_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 설정값 삽입
INSERT INTO line_integration_settings (setting_key, setting_value, description) VALUES
('webhook_url', 'https://hanguru.school/api/line/webhook', 'LINE 웹훅 URL'),
('auto_reply_enabled', 'true', '자동 응답 활성화 여부'),
('welcome_message', '안녕하세요! MalMoi 한국어 학습 플랫폼입니다. 😊', '환영 메시지'),
('class_notification_enabled', 'true', '수업 알림 활성화 여부'),
('attendance_reminder_enabled', 'true', '출석 확인 알림 활성화 여부')
ON CONFLICT (setting_key) DO NOTHING;

-- 뷰 생성 (LINE 연동 사용자 통계)
CREATE OR REPLACE VIEW line_user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN line_id IS NOT NULL THEN 1 END) as line_users,
    COUNT(CASE WHEN login_method = 'line' THEN 1 END) as line_login_users,
    COUNT(CASE WHEN login_method = 'email' THEN 1 END) as email_login_users
FROM users;

-- 함수 생성 (LINE 사용자 등록)
CREATE OR REPLACE FUNCTION register_line_user(
    p_line_id VARCHAR(255),
    p_line_display_name VARCHAR(255),
    p_line_picture_url TEXT,
    p_email VARCHAR(255) DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- 기존 LINE 사용자 확인
    SELECT id INTO v_user_id FROM users WHERE line_id = p_line_id;
    
    IF v_user_id IS NOT NULL THEN
        -- 기존 사용자 업데이트
        UPDATE users 
        SET line_display_name = p_line_display_name,
            line_picture_url = p_line_picture_url,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_user_id;
        
        RETURN v_user_id;
    ELSE
        -- 새 사용자 생성
        INSERT INTO users (
            email, 
            name, 
            line_id, 
            line_display_name, 
            line_picture_url, 
            login_method,
            role,
            created_at,
            updated_at
        ) VALUES (
            COALESCE(p_email, p_line_id || '@line.user'),
            p_line_display_name,
            p_line_id,
            p_line_display_name,
            p_line_picture_url,
            'line',
            'student',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_user_id;
        
        RETURN v_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql; 