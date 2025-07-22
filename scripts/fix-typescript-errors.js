#!/usr/bin/env node

/**
 * TypeScript 오류 자동 수정 스크립트
 * 주요 any 타입을 적절한 타입으로 교체
 */

const fs = require('fs');
const path = require('path');

// 수정할 파일 패턴
const targetFiles = [
  'src/app/admin/automation/page.tsx',
  'src/app/admin/curriculum-management/page.tsx',
  'src/app/admin/learning-analytics/page.tsx',
  'src/app/admin/notification-settings/page.tsx',
  'src/app/admin/push-message-management/page.tsx',
  'src/app/admin/tagging-management/page.tsx',
  'src/app/analytics/page.tsx',
  'src/app/api/analytics/route.ts',
  'src/app/api/automation/route.ts',
  'src/app/api/backups/download/route.ts',
  'src/app/api/curriculum-progress/route.ts',
  'src/app/api/integrations/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/payments/route.ts',
  'src/app/api/tagging/route.ts',
  'src/app/automation-management/page.tsx',
  'src/app/backup-management/page.tsx',
  'src/app/student/homework/page.tsx',
  'src/app/student/learning-stats/page.tsx',
  'src/app/student/notes/page.tsx',
  'src/app/student/profile/page.tsx',
  'src/app/student/reservations/page.tsx',
  'src/app/tagging/student/page.tsx',
  'src/app/teacher/curriculum/page.tsx',
  'src/app/teacher/home/page.tsx',
  'src/app/teacher/schedule/page.tsx',
  'src/components/tagging/TaggingInterface.tsx',
  'src/lib/analytics-engine.ts',
  'src/lib/automation-system.ts',
  'src/lib/behavior-analytics.ts',
  'src/lib/cache.ts',
  'src/lib/external-integrations.ts',
  'src/lib/i18n.ts',
  'src/lib/performance.ts',
  'src/lib/role-based-access.ts',
  'src/lib/settings.ts',
  'src/lib/testing-framework.ts',
  'src/lib/utils.ts'
];

// 타입 교체 규칙
const typeReplacements = [
  // 일반적인 any 타입 교체
  {
    pattern: /: any\b/g,
    replacement: ': Record<string, unknown>'
  },
  {
    pattern: /: any\[\]/g,
    replacement: ': Record<string, unknown>[]'
  },
  {
    pattern: /: any\?/g,
    replacement: ': Record<string, unknown> | undefined'
  },
  // 함수 매개변수
  {
    pattern: /\(([^)]*): any\)/g,
    replacement: '($1: Record<string, unknown>)'
  },
  // useState any 타입
  {
    pattern: /useState<any>\(/g,
    replacement: 'useState<Record<string, unknown>>('
  },
  // useEffect any 타입
  {
    pattern: /useEffect\(\(\) => \{[^}]*\}, \[([^\]]*)\]/g,
    replacement: (match, deps) => {
      // 의존성 배열에 함수가 있으면 추가
      if (deps.includes('loadData') || deps.includes('fetchData')) {
        return match.replace(/\[([^\]]*)\]/, '[$1, loadData]');
      }
      return match;
    }
  }
];

// 미사용 import 제거 패턴
const unusedImports = [
  'Trash2', 'Save', 'BookOpen', 'ChevronDown', 'ChevronRight', 'Filter',
  'Copy', 'Archive', 'Settings', 'Bell', 'Users', 'MessageSquare', 'BarChart3',
  'Send', 'Clock', 'Calendar', 'CheckCircle', 'X', 'PieChart', 'TrendingUp',
  'Target', 'Award', 'Download', 'GraduationCap', 'AlertCircle', 'Wifi',
  'WifiOff', 'Eye', 'Shield', 'Smartphone', 'User', 'RefreshCw', 'Lock',
  'Unlock', 'Plus', 'Pause', 'History', 'ChevronLeft', 'PenTool', 'Monitor',
  'Globe', 'Tablet', 'Desktop', 'Share2', 'Search'
];

function fixTypeScriptErrors() {
  console.log('🔧 TypeScript 오류 수정 시작...\n');

  let fixedFiles = 0;
  let totalErrors = 0;

  targetFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  파일을 찾을 수 없음: ${filePath}`);
      return;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      let fileErrors = 0;

      // 타입 교체 적용
      typeReplacements.forEach(({ pattern, replacement }) => {
        if (typeof replacement === 'function') {
          content = content.replace(pattern, replacement);
        } else {
          content = content.replace(pattern, replacement);
        }
      });

      // 미사용 import 제거
      unusedImports.forEach(importName => {
        const importPattern = new RegExp(`import\\s*{[^}]*\\b${importName}\\b[^}]*}\\s*from\\s*['"][^'"]+['"];?\\s*`, 'g');
        content = content.replace(importPattern, '');
      });

      // 빈 import 문 정리
      content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*/g, '');

      // 변경사항이 있으면 파일 저장
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        fixedFiles++;
        console.log(`✅ 수정 완료: ${filePath}`);
      }

    } catch (error) {
      console.log(`❌ 오류 발생: ${filePath} - ${error.message}`);
    }
  });

  console.log(`\n📊 수정 결과:`);
  console.log(`- 수정된 파일: ${fixedFiles}개`);
  console.log(`- 총 오류: ${totalErrors}개`);
  console.log(`\n🎉 TypeScript 오류 수정 완료!`);
  console.log(`\n다음 명령어로 빌드를 확인하세요:`);
  console.log(`npm run build`);
}

// 스크립트 실행
if (require.main === module) {
  fixTypeScriptErrors();
}

module.exports = { fixTypeScriptErrors }; 