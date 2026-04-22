#!/usr/bin/env node

/**
 * 운영 서버 환경 체크 스크립트
 * 이 스크립트는 현재 환경이 운영 서버인지 확인합니다.
 */

const fs = require("fs");
const path = require("path");

// 운영 서버 도메인
const PRODUCTION_DOMAIN = "portal.hanguru.blog";

// 환경 변수 파일 경로
const envFiles = [".env.local", ".env.production", ".env"];

function checkEnvironment() {
  console.log("🔍 운영 서버 환경 체크를 시작합니다...\n");

  // 1. 환경 변수 파일 확인
  console.log("1. 환경 변수 파일 확인:");
  let envFileFound = false;

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`   ✅ ${envFile} 파일이 존재합니다`);
      envFileFound = true;

      // 환경 변수 내용 확인
      const envContent = fs.readFileSync(envFile, "utf8");
      const lines = envContent.split("\n");

      let productionUrlFound = false;
      let environmentFound = false;

      for (const line of lines) {
        if (line.includes("NEXT_PUBLIC_PRODUCTION_URL")) {
          if (line.includes(PRODUCTION_DOMAIN)) {
            console.log(
              `   ✅ 운영 서버 URL이 올바르게 설정됨: ${line.trim()}`,
            );
            productionUrlFound = true;
          } else {
            console.log(`   ❌ 운영 서버 URL이 잘못 설정됨: ${line.trim()}`);
          }
        }

        if (line.includes("NEXT_PUBLIC_ENVIRONMENT")) {
          if (line.includes("production")) {
            console.log(`   ✅ 환경이 production으로 설정됨: ${line.trim()}`);
            environmentFound = true;
          } else {
            console.log(`   ❌ 환경이 잘못 설정됨: ${line.trim()}`);
          }
        }
      }

      if (!productionUrlFound) {
        console.log(`   ⚠️  NEXT_PUBLIC_PRODUCTION_URL 설정이 없습니다`);
      }

      if (!environmentFound) {
        console.log(`   ⚠️  NEXT_PUBLIC_ENVIRONMENT 설정이 없습니다`);
      }
    } else {
      console.log(`   ❌ ${envFile} 파일이 없습니다`);
    }
  }

  if (!envFileFound) {
    console.log(
      "   ⚠️  환경 변수 파일이 없습니다. .env.local 파일을 생성하세요.",
    );
  }

  // 2. Vercel 설정 확인
  console.log("\n2. Vercel 설정 확인:");
  const vercelConfigPath = "vercel.json";

  if (fs.existsSync(vercelConfigPath)) {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"));

    if (vercelConfig.git && vercelConfig.git.deploymentEnabled) {
      if (
        vercelConfig.git.deploymentEnabled.main === true &&
        vercelConfig.git.deploymentEnabled.preview === false
      ) {
        console.log("   ✅ Preview 배포가 비활성화되고 main 브랜치만 활성화됨");
      } else {
        console.log("   ❌ Preview 배포 설정이 잘못됨");
      }
    } else {
      console.log("   ⚠️  Git 배포 설정이 없습니다");
    }
  } else {
    console.log("   ❌ vercel.json 파일이 없습니다");
  }

  // 3. Next.js 설정 확인
  console.log("\n3. Next.js 설정 확인:");
  const nextConfigPath = "next.config.ts";

  if (fs.existsSync(nextConfigPath)) {
    const nextConfigContent = fs.readFileSync(nextConfigPath, "utf8");

    if (nextConfigContent.includes("NEXT_PUBLIC_PRODUCTION_URL")) {
      console.log("   ✅ 운영 서버 URL이 Next.js 설정에 포함됨");
    } else {
      console.log("   ⚠️  운영 서버 URL이 Next.js 설정에 없습니다");
    }

    if (nextConfigContent.includes("Strict-Transport-Security")) {
      console.log("   ✅ 보안 헤더가 설정됨");
    } else {
      console.log("   ⚠️  보안 헤더 설정이 없습니다");
    }
  } else {
    console.log("   ❌ next.config.ts 파일이 없습니다");
  }

  // 4. GitHub Actions 확인
  console.log("\n4. GitHub Actions 확인:");
  const workflowsPath = ".github/workflows";

  if (fs.existsSync(workflowsPath)) {
    const workflowFiles = fs.readdirSync(workflowsPath);
    const productionWorkflow = workflowFiles.find((file) =>
      file.includes("production"),
    );

    if (productionWorkflow) {
      console.log(`   ✅ 운영 배포 워크플로우가 존재함: ${productionWorkflow}`);
    } else {
      console.log("   ⚠️  운영 배포 워크플로우가 없습니다");
    }
  } else {
    console.log("   ❌ .github/workflows 디렉토리가 없습니다");
  }

  // 5. app 라우터 구조 확인
  console.log("\n5. app 라우터 구조 확인:");
  const loginPagePath = "app/login/page.js";
  const middlewarePath = "middleware.js";

  if (fs.existsSync(loginPagePath)) {
    console.log(`   ✅ 로그인 페이지가 존재함: ${loginPagePath}`);
  } else {
    console.log(`   ❌ 로그인 페이지가 없습니다: ${loginPagePath}`);
  }

  if (fs.existsSync(middlewarePath)) {
    console.log(`   ✅ 루트 미들웨어가 존재함: ${middlewarePath}`);
  } else {
    console.log("   ℹ️  루트 미들웨어 없음 (현재 구조에서 정상)");
  }

  console.log("\n📋 체크 완료!");
  console.log("\n💡 다음 사항을 확인하세요:");
  console.log("   - .env.local 파일에 운영 서버 환경 변수 설정");
  console.log("   - Vercel에서 Preview 배포 비활성화");
  console.log("   - GitHub에서 main 브랜치 보호 설정");
  console.log("   - https://portal.hanguru.blog 에서 테스트");
}

// 스크립트 실행
if (require.main === module) {
  checkEnvironment();
}

module.exports = { checkEnvironment };
