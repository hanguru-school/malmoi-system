import { StudentIdentifierData } from '@/types/student';

// 고유 식별번호 생성 함수
export function generateUniqueIdentifier(): string {
  // 현재 타임스탬프 (밀리초)
  const timestamp = Date.now();
  
  // 랜덤 숫자 (6자리)
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  // 시스템 식별자 (3자리 - 이 시스템을 위한 고유 코드)
  const systemId = '001';
  
  // 체크섬 (2자리)
  const checksum = calculateChecksum(`${timestamp}${random}${systemId}`);
  
  return `${timestamp}${random}${systemId}${checksum}`;
}

// 체크섬 계산 함수
function calculateChecksum(input: string): string {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += parseInt(input[i]) * (i + 1);
  }
  return (sum % 100).toString().padStart(2, '0');
}

// QR코드 데이터 생성 함수
export function generateQRCodeData(studentData: StudentIdentifierData): string {
  const data = {
    ...studentData,
    timestamp: new Date().toISOString(),
    checksum: calculateDataChecksum(studentData)
  };
  
  return JSON.stringify(data);
}

// 데이터 체크섬 계산
function calculateDataChecksum(data: StudentIdentifierData): string {
  const dataString = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// QR코드 데이터 검증 함수
export function validateQRCodeData(qrData: string): { isValid: boolean; data?: StudentIdentifierData; error?: string } {
  try {
    const parsed = JSON.parse(qrData);
    
    // 필수 필드 확인
    const requiredFields = ['studentId', 'identifierCode', 'studentName', 'studentEmail', 'checksum'];
    for (const field of requiredFields) {
      if (!parsed[field]) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }
    
    // 체크섬 검증
    const { checksum, ...dataWithoutChecksum } = parsed;
    const calculatedChecksum = calculateDataChecksum(dataWithoutChecksum);
    
    if (checksum !== calculatedChecksum) {
      return { isValid: false, error: 'Invalid checksum' };
    }
    
    return { isValid: true, data: dataWithoutChecksum };
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON format' };
  }
}

// 식별번호 형식 검증
export function validateIdentifierFormat(identifier: string): boolean {
  // 21자리 숫자 형식 검증
  const identifierRegex = /^\d{21}$/;
  if (!identifierRegex.test(identifier)) {
    return false;
  }
  
  // 체크섬 검증
  const mainPart = identifier.slice(0, -2);
  const checksum = identifier.slice(-2);
  const calculatedChecksum = calculateChecksum(mainPart);
  
  return checksum === calculatedChecksum;
}

// 식별번호에서 정보 추출
export function extractIdentifierInfo(identifier: string): {
  timestamp: Date;
  randomPart: string;
  systemId: string;
  checksum: string;
} {
  const timestamp = new Date(parseInt(identifier.slice(0, 13)));
  const randomPart = identifier.slice(13, 19);
  const systemId = identifier.slice(19, 22);
  const checksum = identifier.slice(22, 24);
  
  return {
    timestamp,
    randomPart,
    systemId,
    checksum
  };
} 