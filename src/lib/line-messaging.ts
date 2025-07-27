// LINE Messaging API 유틸리티

export interface LineMessage {
  type: 'text' | 'image' | 'video' | 'audio' | 'location' | 'sticker' | 'template';
  text?: string;
  originalContentUrl?: string;
  previewImageUrl?: string;
  title?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  packageId?: string;
  stickerId?: string;
  template?: any;
}

export interface LineUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * LINE 메시지 전송
 */
export async function sendLineMessage(userId: string, message: LineMessage) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [message],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('LINE 메시지 전송 실패:', error);
      throw new Error(`LINE 메시지 전송 실패: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('LINE 메시지 전송 오류:', error);
    throw error;
  }
}

/**
 * 텍스트 메시지 전송
 */
export async function sendTextMessage(userId: string, text: string) {
  return sendLineMessage(userId, {
    type: 'text',
    text: text,
  });
}

/**
 * 수업 알림 메시지 전송
 */
export async function sendClassNotification(userId: string, classInfo: {
  title: string;
  time: string;
  teacher: string;
  zoomLink?: string;
}) {
  const message = `📚 수업 알림

📖 ${classInfo.title}
⏰ ${classInfo.time}
👨‍🏫 ${classInfo.teacher}
${classInfo.zoomLink ? `🔗 ${classInfo.zoomLink}` : ''}

수업 준비를 잊지 마세요! 😊`;

  return sendTextMessage(userId, message);
}

/**
 * 출석 확인 요청 메시지 전송
 */
export async function sendAttendanceRequest(userId: string, classInfo: {
  title: string;
  time: string;
}) {
  const message = `✅ 출석 확인 요청

📖 ${classInfo.title}
⏰ ${classInfo.time}

수업이 시작되었습니다. 출석 태깅을 해주세요!`;

  return sendTextMessage(userId, message);
}

/**
 * 학습 진도 안내 메시지 전송
 */
export async function sendProgressNotification(userId: string, progressInfo: {
  level: string;
  progress: number;
  nextGoal: string;
}) {
  const message = `📈 학습 진도 안내

🎯 현재 레벨: ${progressInfo.level}
📊 진행률: ${progressInfo.progress}%
🎯 다음 목표: ${progressInfo.nextGoal}

계속해서 열심히 공부해주세요! 💪`;

  return sendTextMessage(userId, message);
}

/**
 * LINE 사용자 프로필 가져오기
 */
export async function getLineUserProfile(userId: string): Promise<LineUser> {
  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('LINE 프로필 가져오기 실패:', error);
      throw new Error(`LINE 프로필 가져오기 실패: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('LINE 프로필 가져오기 오류:', error);
    throw error;
  }
}

/**
 * LINE 웹훅 검증
 */
export function verifyLineWebhook(body: string, signature: string): boolean {
  const crypto = require('crypto');
  const channelSecret = process.env.LINE_MESSAGING_SECRET;
  
  if (!channelSecret) {
    console.error('LINE_MESSAGING_SECRET이 설정되지 않았습니다.');
    return false;
  }

  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');

  return hash === signature;
} 