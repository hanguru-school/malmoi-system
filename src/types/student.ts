export interface StudentIdentifier {
  id: string;
  studentId: string;
  identifierCode: string;
  identifierType: 'qr' | 'barcode';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastUsedAt?: Date;
  usageCount: number;
}

export interface StudentIdentifierHistory {
  id: string;
  studentId: string;
  oldIdentifierCode?: string;
  newIdentifierCode: string;
  reason: 'initial' | 'reissue' | 'system_update';
  issuedBy: string; // admin ID
  issuedAt: Date;
  notes?: string;
}

export interface StudentIdentifierData {
  studentId: string;
  identifierCode: string;
  studentName: string;
  studentEmail: string;
  department: string;
  currentLevel: string;
  points: number;
  totalClasses: number;
  completedClasses: number;
  studyStreak: number;
  averageScore: number;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  createdAt: Date;
  version: string;
} 