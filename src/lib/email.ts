// 이메일 발송 유틸리티 함수

interface WelcomeEmailData {
  email: string;
  studentId: string;
  initialPassword: string;
  nameKanji: string;
  nameYomigana: string;
  rulesAgreement: any;
  enrollmentData: any;
}

interface EmergencyContactEmailData {
  emergencyContactEmail: string;
  emergencyContactNameKanji: string;
  emergencyContactNameYomigana: string;
  emergencyContactRelation: string;
  studentNameKanji: string;
  studentNameYomigana: string;
  studentEmail: string;
  studentPhone: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  // 실제 이메일 발송 로직은 여기에 구현
  // 예: Nodemailer, SendGrid, AWS SES 등을 사용
  
  console.log('=== 환영 이메일 발송 ===');
  console.log('수신자:', data.email);
  console.log('학번:', data.studentId);
  console.log('초기 비밀번호:', data.initialPassword);
  console.log('이름 (한자):', data.nameKanji);
  console.log('이름 (요미가나):', data.nameYomigana);
  console.log('규정 동의:', data.rulesAgreement ? '완료' : '미완료');
  console.log('=======================');

  // 실제 구현에서는 다음과 같은 내용을 포함한 이메일을 발송:
  // 1. 학생 정보 (학번 포함)
  // 2. 초기 비밀번호 (핸드폰 뒤 4자리)
  // 3. 첫 로그인 시 패스워드 변경 안내
  // 4. 개인정보 입력 안내
  // 5. 규정 동의서 PDF 첨부
  // 6. 입회 동의서 PDF 첨부
  
  // 임시로 성공 반환
  return Promise.resolve();
}

export async function sendEmergencyContactNotification(data: EmergencyContactEmailData) {
  try {
    const emailContent = `
안녕하세요 ${data.emergencyContactNameKanji}님,

${data.studentNameKanji}(${data.studentNameYomigana})님이 귀하를 비상시 연락을 받을 수 있는 사람으로 한국어 교실 말모이에 등록하셨습니다.

■ 등록된 정보
- 학생명: ${data.studentNameKanji} (${data.studentNameYomigana})
- 학생 연락처: ${data.studentPhone}
- 학생 이메일: ${data.studentEmail}
- 귀하와의 관계: ${data.emergencyContactRelation}

■ 비상시 연락 안내
비상시 교실 측에서 귀하께 연락을 드릴 수 있습니다. 
이 경우 학생의 안전과 관련된 중요한 사항에 대해 협조를 요청드릴 수 있습니다.

■ 교실 정보
- 교실명: 한국어 교실 말모이 (MalMoi Korean Language Classroom)
- 연락처: office@hanguru.school
- 주소: 大阪府富田林市喜志町５丁目１−２　SAMURAI BLD　４D

■ 개인정보 보호
본 이메일은 학생이 등록 시 제공한 정보를 바탕으로 발송되었습니다.
개인정보는 관련 법령에 따라 보호되며, 비상시 연락 목적으로만 사용됩니다.

문의사항이 있으시면 언제든지 교실로 연락주시기 바랍니다.

감사합니다.
한국어 교실 말모이 드림
    `;

    const htmlContent = `
      <div style="font-family: 'Noto Sans JP', sans-serif; line-height: 1.6; color: #333;">
        <p>안녕하세요 ${data.emergencyContactNameKanji}님,</p>
        <p>${data.studentNameKanji}(${data.studentNameYomigana})님이 귀하를 비상시 연락을 받을 수 있는 사람으로 한국어 교실 말모이에 등록하셨습니다.</p>
        
        <h3 style="color: #2563eb; margin-top: 20px;">■ 등록된 정보</h3>
        <ul>
          <li>학생명: ${data.studentNameKanji} (${data.studentNameYomigana})</li>
          <li>학생 연락처: ${data.studentPhone}</li>
          <li>학생 이메일: ${data.studentEmail}</li>
          <li>귀하와의 관계: ${data.emergencyContactRelation}</li>
        </ul>
        
        <h3 style="color: #2563eb; margin-top: 20px;">■ 비상시 연락 안내</h3>
        <p>비상시 교실 측에서 귀하께 연락을 드릴 수 있습니다. 이 경우 학생의 안전과 관련된 중요한 사항에 대해 협조를 요청드릴 수 있습니다.</p>
        
        <h3 style="color: #2563eb; margin-top: 20px;">■ 교실 정보</h3>
        <ul>
          <li>교실명: 한국어 교실 말모이 (MalMoi Korean Language Classroom)</li>
          <li>연락처: office@hanguru.school</li>
          <li>주소: 大阪府富田林市喜志町５丁目１−２　SAMURAI BLD　４D</li>
        </ul>
        
        <h3 style="color: #2563eb; margin-top: 20px;">■ 개인정보 보호</h3>
        <p>본 이메일은 학생이 등록 시 제공한 정보를 바탕으로 발송되었습니다. 개인정보는 관련 법령에 따라 보호되며, 비상시 연락 목적으로만 사용됩니다.</p>
        
        <p style="margin-top: 30px;">문의사항이 있으시면 언제든지 교실로 연락주시기 바랍니다.</p>
        <p>감사합니다.<br>한국어 교실 말모이 드림</p>
      </div>
    `;

    // 이메일 발송 API 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.emergencyContactEmail,
        subject: `[MalMoi韓国語教室] ${data.studentNameKanji}님의 입회 등록 안내`,
        html: htmlContent,
        text: emailContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '이메일 발송 실패');
    }

    const result = await response.json();
    console.log('긴급연락처 알림 이메일 발송 성공:', result.messageId);
    return result;
  } catch (error) {
    console.error('긴급연락처 알림 이메일 발송 오류:', error);
    throw error;
  }
}

// PDF 생성 함수 (규정 동의서, 입회 동의서)
export async function generatePDFs(studentData: any, rulesAgreement: any) {
  // 실제 PDF 생성 로직은 여기에 구현
  // 예: Puppeteer, jsPDF 등을 사용
  
  console.log('=== PDF 생성 ===');
  console.log('학생 데이터:', studentData);
  console.log('규정 동의 데이터:', rulesAgreement);
  console.log('===============');
  
  // 임시로 성공 반환
  return Promise.resolve({
    rulesAgreementPDF: 'rules-agreement.pdf',
    enrollmentAgreementPDF: 'enrollment-agreement.pdf'
  });
}
