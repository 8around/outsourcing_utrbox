# Claude Code Instructions

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

## 주요 파일 

## 임시 로그인 계정
- Email: pulwind00@gmail.com
- PW: Youngtest002!

## 대화
- 사용자와 대화할떄는 무조건 한국말로

## 수정하면 안되는 파일
- .env
- .mcp.json
- PRD.md

## 작업 방식
- 기능 개발, 수정, 버그 픽스를 한 후에 PlayWright MCP를 통해서 완벽하게 하였는지 체크하세요.

## 문제 해결 방식
- 근본적인 문제를 해결하세요.
 - ex: 로그인 후 데이터가 추가되어야하는 테이블에 추가가안되어서 INSERT 문으로 문제를 해결하는 방식은 하면 안됩니다.
- 로그를 우선적으로 보고 문제를 해결하세요.
- 라이브러리, 프레임워크, 언어 버전을 낮추거나 올려서 해결하는 문제는 작업을 멈추고 왜 그렇게 해야하는지 자세하게 설명하세요.

## 기능 개발 & 수정 & DB 설계시
- PRD.md 파일을 읽어야함
- FOLDER_STURCTURE.md의 디렉터리 구조를 기본적으로 따르고 모순점이 있다면 수정 후 반영해야함
- 작업에 앞서 계획을 ./docs 디렉터리에 '000_' 세자리 숫자를 prefix로 하여 차례대로 붙여 마크다운 형식 문서를 작성하세요.

## 데이터베이스 관리 규칙

### 스키마 동기화 요구사항
- **schema.sql과 Supabase 일치성**
  - DATABASE_SCHEMA.md 파일과 실제 Supabase 데이터베이스는 항상 동기화되어야 함
  - 모든 테이블, 컬럼, 타입, 제약조건이 정확히 일치해야 함
  - RLS 정책, 인덱스, 트리거도 동일하게 유지되어야 함
  - supabase 데이터베이스 types는 [database.type.ts](./types/database.type.ts) 파일에 위치
  - brew로 설치된 supabase cli 명령어로 로컬 supabase에 동기화

### 데이터베이스 변경 프로세스
- **컬럼 추가/수정 시 필수 절차**
  1. **개발자 승인 필수**: DB 컬럼을 추가하거나 수정하기 전에 반드시 개발자에게 문의하고 승인받아야 함
  2. **영향도 분석**: 변경사항이 기존 기능에 미치는 영향을 사전에 분석
  3. **schema.sql 업데이트**: 승인된 변경사항을 schema.sql 파일에 먼저 반영
  4. **Supabase 적용**: schema.sql의 변경사항을 Supabase에 마이그레이션
  5. **코드 수정**: 관련된 TypeScript 타입 정의 및 서비스 로직 업데이트
  6. **테스트**: 변경사항이 정상 작동하는지 확인

### 주의사항
- **무단 변경 금지**: 개발자 승인 없이 데이터베이스를 직접 수정하지 말 것
- **동기화 검증**: 정기적으로 schema.sql과 Supabase의 일치 여부를 확인
- **문서화**: 모든 DB 변경사항은 변경 사유와 함께 문서화되어야 함
- **백업**: 중요한 변경 전에는 반드시 데이터베이스 백업 수행