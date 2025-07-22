'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, lineProvider, COLLECTIONS, User, UserRole, isFirebaseConfigValid } from '@/lib/firebase';

// 인증 컨텍스트 타입
interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithLine: () => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  getDefaultPageByRole: (role: UserRole) => string;
}

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 권한별 기본 페이지 매핑
const getDefaultPageByRole = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin/home';
    case 'teacher':
      return '/teacher/home';
    case 'student':
      return '/student/home';
    case 'staff':
      return '/staff/home';
    default:
      return '/master';
  }
};

// 개발용 임시 사용자 데이터 (Firebase 연결 실패 시 사용)
const devUsers: Record<string, User> = {
  'admin@hanguru.school': {
    id: 'admin-001',
    email: 'admin@hanguru.school',
    name: '주용진',
    role: 'admin',
    department: '시스템관리팀',
    permissions: ['user:manage', 'reservation:manage', 'facility:manage', 'report:view', 'system:configure', 'security:manage', 'log:view', 'notification:manage'],
    phone: '010-0000-0000',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'teacher@hanguru.school': {
    id: 'teacher-001',
    email: 'teacher@hanguru.school',
    name: '박교수',
    role: 'teacher',
    department: '컴퓨터공학과',
    permissions: ['reservation:manage', 'report:view', 'facility:view'],
    phone: '010-2345-6789',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'student@hanguru.school': {
    id: 'student-001',
    email: 'student@hanguru.school',
    name: '김학생',
    role: 'student',
    department: '컴퓨터공학과',
    permissions: ['reservation:create', 'reservation:view', 'facility:view'],
    phone: '010-1234-5678',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'staff@hanguru.school': {
    id: 'staff-001',
    email: 'staff@hanguru.school',
    name: '이직원',
    role: 'staff',
    department: '행정팀',
    permissions: ['reservation:manage', 'facility:manage', 'user:view', 'notification:manage'],
    phone: '010-3456-7890',
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// 개발용 비밀번호
const devPasswords: Record<string, string> = {
  'admin@hanguru.school': 'admin123!',
  'teacher@hanguru.school': 'teacher456!',
  'student@hanguru.school': 'student789!',
  'staff@hanguru.school': 'staff012!'
};

// 인증 프로바이더 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);

  // Firebase 인증 상태 변경 감지
  useEffect(() => {
    // 개발 모드 체크 (Firebase 설정이 유효하지 않은 경우)
    const checkDevMode = () => {
      if (!isFirebaseConfigValid()) {
        console.log('Firebase 설정이 유효하지 않아 개발 모드로 전환합니다.');
        setIsDevMode(true);
        setLoading(false);
        return true;
      }
      console.log('Firebase 설정이 유효합니다. Firebase 모드로 실행합니다.');
      return false;
    };

    const isDev = checkDevMode();
    if (isDev) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Firestore에서 사용자 정보 가져오기
        try {
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
          }
        } catch (error) {
          console.error('사용자 정보 로드 실패:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // 개발 모드 강제 체크
      if (!isFirebaseConfigValid() || isDevMode) {
        console.log('개발 모드에서 로그인 시도:', email);
        // 개발 모드: 임시 사용자 데이터 사용
        const devUser = devUsers[email];
        const devPassword = devPasswords[email];
        
        if (!devUser || password !== devPassword) {
          console.log('개발 모드 로그인 실패: 사용자 또는 비밀번호 불일치');
          console.log('입력된 이메일:', email);
          console.log('입력된 비밀번호:', password);
          console.log('사용 가능한 계정들:', Object.keys(devUsers));
          throw new Error('이메일 또는 비밀번호가 일치하지 않습니다');
        }
        
        console.log('개발 모드 로그인 성공:', devUser);
        setUser(devUser);
        console.log('사용자 상태 설정 완료:', devUser);
        return;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Firestore에서 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log('Firebase 로그인 성공:', userData);
        setUser(userData);
      }
    } catch (error: any) {
      console.error('로그인 실패:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // LINE 로그인 함수
  const signInWithLine = async () => {
    try {
      if (isDevMode) {
        // 개발 모드: 임시 사용자 데이터 사용
        const devUser = devUsers['student@hanguru.school'];
        setUser(devUser);
        return;
      }
      
      const result = await signInWithPopup(auth, lineProvider);
      const firebaseUser = result.user;
      
      // LINE 사용자 정보에서 기본 정보 추출
      const displayName = firebaseUser.displayName || 'LINE 사용자';
      const email = firebaseUser.email || `${firebaseUser.uid}@line.user`;
      
      // Firestore에서 기존 사용자 확인
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // 새 사용자 생성
        const newUser: User = {
          id: firebaseUser.uid,
          email,
          name: displayName,
          role: 'student',
          department: '일반',
          permissions: getDefaultPermissions('student'),
          phone: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
        setUser(newUser);
      } else {
        // 기존 사용자 정보 로드
        const userData = userDoc.data() as User;
        setUser(userData);
      }
    } catch (error: any) {
      console.error('LINE 로그인 실패:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('로그인이 취소되었습니다');
      } else {
        throw new Error('LINE 로그인에 실패했습니다');
      }
    }
  };

  // 회원가입 함수
  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      if (isDevMode) {
        // 개발 모드에서는 임시 사용자 생성
        const tempId = `temp-${Date.now()}`;
        const newUser: User = {
          id: tempId,
          email,
          name,
          role,
          department: role === 'student' ? '일반' : role === 'teacher' ? '컴퓨터공학과' : '행정팀',
          permissions: getDefaultPermissions(role),
          phone: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // 개발용 사용자 목록에 추가
        devUsers[email] = newUser;
        devPasswords[email] = password;
        
        setUser(newUser);
        return;
      }
      
      // Firebase 회원가입
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Firebase 프로필 업데이트
      await updateProfile(firebaseUser, { displayName: name });

      // Firestore에 사용자 정보 저장
      const userData: Omit<User, 'id'> = {
        email,
        name,
        role,
        department: role === 'student' ? '일반' : role === 'teacher' ? '컴퓨터공학과' : '행정팀',
        permissions: getDefaultPermissions(role),
        phone: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), userData);
      
      // 로컬 상태 업데이트
      setUser({ id: firebaseUser.uid, ...userData });
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      
      // 구체적인 에러 메시지 처리
      let errorMessage = getAuthErrorMessage(error.code);
      
      // 추가적인 에러 처리
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = '이미 사용 중인 이메일입니다';
          break;
        case 'auth/invalid-email':
          errorMessage = '유효하지 않은 이메일 주소입니다';
          break;
        case 'auth/weak-password':
          errorMessage = '비밀번호가 너무 약합니다. 최소 8자 이상이어야 합니다';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = '이메일/비밀번호 회원가입이 비활성화되어 있습니다';
          break;
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요';
          break;
        default:
          if (error.message) {
            errorMessage = error.message;
          }
      }
      
      throw new Error(errorMessage);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      if (isDevMode) {
        setUser(null);
        return;
      }
      
      await signOut(auth);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  };

  // 사용자 프로필 업데이트
  const updateUserProfile = async (updates: Partial<User>) => {
    if (isDevMode) {
      if (!user) throw new Error('로그인이 필요합니다');
      
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      setUser(updatedUser);
      return;
    }

    if (!firebaseUser) throw new Error('로그인이 필요합니다');

    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        ...updates,
        updatedAt: new Date()
      });
      
      // 로컬 상태 업데이트
      setUser(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signInWithLine,
    signUp,
    logout,
    updateUserProfile,
    getDefaultPageByRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 인증 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 역할별 기본 권한 설정
function getDefaultPermissions(role: UserRole): string[] {
  switch (role) {
    case 'admin':
      return ['user:manage', 'reservation:manage', 'facility:manage', 'report:view', 'system:configure', 'security:manage', 'log:view', 'notification:manage'];
    case 'teacher':
      return ['reservation:manage', 'report:view', 'facility:view'];
    case 'student':
      return ['reservation:create', 'reservation:view', 'facility:view'];
    case 'staff':
      return ['reservation:manage', 'facility:manage', 'user:view', 'notification:manage'];
    default:
      return [];
  }
}

// Firebase 오류 메시지 변환
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return '등록되지 않은 사용자입니다';
    case 'auth/wrong-password':
      return '비밀번호가 일치하지 않습니다';
    case 'auth/invalid-email':
      return '유효하지 않은 이메일입니다';
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다';
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다';
    case 'auth/too-many-requests':
      return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요';
    default:
      return '인증 중 오류가 발생했습니다';
  }
} 