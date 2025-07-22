#!/usr/bin/env node

/**
 * 남은 TypeScript 오류 수정 스크립트
 * any 타입과 누락된 import 수정
 */

const fs = require('fs');
const path = require('path');

// 수정할 파일과 해당 any 타입 위치
const remainingAnyTypes = [
  {
    file: 'src/app/admin/automation/page.tsx',
    lines: [423, 438, 470, 515, 589],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/admin/learning-analytics/page.tsx',
    lines: [372, 384],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/admin/notification-settings/page.tsx',
    lines: [168, 169, 172, 205, 206, 209],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/admin/push-message-management/page.tsx',
    lines: [179, 180, 182, 215, 216, 218, 391, 401],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/api/backups/download/route.ts',
    lines: [37],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/api/notifications/route.ts',
    lines: [28, 338],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/api/payments/route.ts',
    lines: [12],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/automation-management/page.tsx',
    lines: [111],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/backup-management/page.tsx',
    lines: [603],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/student/homework/page.tsx',
    lines: [277],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/student/learning-stats/page.tsx',
    lines: [349],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/student/notes/page.tsx',
    lines: [231],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/student/profile/page.tsx',
    lines: [240],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/student/reservations/page.tsx',
    lines: [186],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/tagging/student/page.tsx',
    lines: [401, 413, 425],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/teacher/curriculum/page.tsx',
    lines: [411],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/app/teacher/schedule/page.tsx',
    lines: [207, 258],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/lib/analytics-engine.ts',
    lines: [91, 302, 326, 377, 451],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/lib/automation-system.ts',
    lines: [403],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/lib/cache.ts',
    lines: [8],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/lib/external-integrations.ts',
    lines: [178, 262],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/lib/settings.ts',
    lines: [303],
    replacement: 'Record<string, unknown>'
  },
  {
    file: 'src/lib/utils.ts',
    lines: [118, 131],
    replacement: 'Record<string, unknown>'
  }
];

// 누락된 import 추가
const missingImports = [
  {
    file: 'src/app/admin/curriculum-management/page.tsx',
    imports: ['Plus', 'Search', 'FileText', 'Target', 'Edit', 'Eye', 'X']
  },
  {
    file: 'src/app/admin/learning-analytics/page.tsx',
    imports: ['Users', 'Calendar', 'CheckCircle', 'Star', 'AlertCircle', 'Search', 'Eye', 'MessageSquare']
  },
  {
    file: 'src/app/admin/notification-settings/page.tsx',
    imports: ['Plus', 'ToggleRight', 'ToggleLeft', 'Edit', 'Eye', 'Send', 'CheckCircle', 'Clock', 'AlertCircle']
  },
  {
    file: 'src/app/admin/push-message-management/page.tsx',
    imports: ['Plus', 'Search', 'Play', 'Pause', 'Edit', 'Eye', 'AlertCircle']
  },
  {
    file: 'src/app/admin/tagging-management/page.tsx',
    imports: ['CreditCard', 'Smartphone', 'BarChart3', 'Plus', 'Edit', 'Trash2', 'Filter', 'CheckCircle', 'XCircle']
  },
  {
    file: 'src/app/analytics/page.tsx',
    imports: ['Home', 'RefreshCw', 'Filter', 'Download', 'Users', 'Calendar', 'TrendingUp', 'BarChart3', 'BookOpen', 'Clock', 'MessageSquare']
  },
  {
    file: 'src/app/automation-management/page.tsx',
    imports: ['Settings', 'Search', 'Plus', 'Pause', 'Play', 'Edit', 'Trash2', 'Activity']
  },
  {
    file: 'src/app/backup-management/page.tsx',
    imports: ['Home', 'Archive', 'HardDrive', 'Calendar', 'Shield', 'Save', 'RotateCcw', 'Download', 'Minus', 'Settings', 'FolderOpen']
  },
  {
    file: 'src/app/student/homework/page.tsx',
    imports: ['Download', 'FileText', 'CheckCircle', 'Star', 'TrendingUp', 'Search', 'BookOpen', 'Clock', 'Calendar', 'AlertCircle', 'Play', 'ChevronRight', 'Share2']
  },
  {
    file: 'src/app/student/learning-stats/page.tsx',
    imports: ['BookOpen', 'Calendar', 'CheckCircle', 'TrendingUp', 'Star', 'Download', 'Share2', 'Award']
  },
  {
    file: 'src/app/student/notes/page.tsx',
    imports: ['Search', 'Calendar', 'Clock', 'MessageSquare', 'Star', 'CheckCircle', 'Bookmark', 'Share2', 'Pause', 'Play', 'Volume2', 'FileText', 'Download', 'BookOpen']
  },
  {
    file: 'src/app/student/profile/page.tsx',
    imports: ['User', 'Award', 'Star', 'Clock', 'Edit', 'Settings', 'BookOpen', 'FileText', 'Mic', 'Calendar', 'Download', 'ChevronRight']
  },
  {
    file: 'src/app/student/reservations/page.tsx',
    imports: ['Clock', 'CheckCircle', 'XCircle', 'AlertCircle', 'Plus', 'Search', 'Calendar', 'User', 'Edit', 'Trash2', 'ChevronLeft', 'ChevronRight']
  },
  {
    file: 'src/app/tagging/student/page.tsx',
    imports: ['Home', 'User', 'CheckCircle', 'AlertCircle', 'BookOpen', 'Clock', 'MoreHorizontal', 'MessageSquare', 'ShoppingCart']
  },
  {
    file: 'src/app/teacher/curriculum/page.tsx',
    imports: ['Play', 'Pause', 'ChevronRight', 'User', 'MessageSquare', 'Edit', 'BookOpen', 'Target', 'Search', 'Clock', 'FileText', 'Calendar', 'CheckCircle', 'Eye']
  },
  {
    file: 'src/app/teacher/home/page.tsx',
    imports: ['CheckCircle', 'Clock', 'AlertCircle', 'Calendar', 'Users', 'TrendingUp', 'DollarSign', 'ChevronRight', 'Wifi', 'MapPin', 'MessageSquare']
  },
  {
    file: 'src/app/teacher/schedule/page.tsx',
    imports: ['Plus', 'ChevronLeft', 'ChevronRight', 'Search', 'Calendar', 'CheckCircle', 'Wifi', 'MapPin', 'Edit', 'MessageSquare']
  },
  {
    file: 'src/components/tagging/TaggingInterface.tsx',
    imports: ['XCircle', 'Loader2', 'CheckCircle', 'CreditCard']
  }
];

function fixRemainingErrors() {
  console.log('🔧 남은 TypeScript 오류 수정 시작...\n');

  let fixedFiles = 0;

  // any 타입 수정
  remainingAnyTypes.forEach(({ file, lines, replacement }) => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  파일을 찾을 수 없음: ${file}`);
      return;
    }

    try {
      let content = fs.readFileSync(file, 'utf8');
      let originalContent = content;

      lines.forEach(lineNum => {
        const lines = content.split('\n');
        if (lines[lineNum - 1]) {
          lines[lineNum - 1] = lines[lineNum - 1].replace(/: any\b/g, `: ${replacement}`);
        }
        content = lines.join('\n');
      });

      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ any 타입 수정: ${file}`);
      }
    } catch (error) {
      console.log(`❌ 오류 발생: ${file} - ${error.message}`);
    }
  });

  // 누락된 import 추가
  missingImports.forEach(({ file, imports }) => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  파일을 찾을 수 없음: ${file}`);
      return;
    }

    try {
      let content = fs.readFileSync(file, 'utf8');
      let originalContent = content;

      // 기존 lucide-react import 찾기
      const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"];?/);
      
      if (importMatch) {
        const existingImports = importMatch[1].split(',').map(imp => imp.trim());
        const newImports = [...new Set([...existingImports, ...imports])];
        
        const newImportStatement = `import { ${newImports.join(', ')} } from 'lucide-react';`;
        content = content.replace(importMatch[0], newImportStatement);
      } else {
        // lucide-react import가 없으면 새로 추가
        const newImportStatement = `import { ${imports.join(', ')} } from 'lucide-react';`;
        const firstImportIndex = content.indexOf('import');
        if (firstImportIndex !== -1) {
          const beforeImports = content.substring(0, firstImportIndex);
          const afterImports = content.substring(firstImportIndex);
          content = beforeImports + newImportStatement + '\n' + afterImports;
        }
      }

      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ import 추가: ${file}`);
        fixedFiles++;
      }
    } catch (error) {
      console.log(`❌ 오류 발생: ${file} - ${error.message}`);
    }
  });

  console.log(`\n📊 수정 결과:`);
  console.log(`- 수정된 파일: ${fixedFiles}개`);
  console.log(`\n🎉 남은 TypeScript 오류 수정 완료!`);
  console.log(`\n다음 명령어로 빌드를 확인하세요:`);
  console.log(`npm run build`);
}

// 스크립트 실행
if (require.main === module) {
  fixRemainingErrors();
}

module.exports = { fixRemainingErrors }; 