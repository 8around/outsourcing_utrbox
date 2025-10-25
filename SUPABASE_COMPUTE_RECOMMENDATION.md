# UTRBOX 프로젝트 Supabase Compute Size 추천

> **작성일**: 2025-10-25
> **목적**: UTRBOX 콘텐츠 저작권 관리 시스템에 최적화된 Supabase compute size 선정

---

## 📊 프로젝트 요구사항 분석

### 1. 시스템 특성

#### 사용자 구성
- **사용자 유형**: 일반 사용자(Member) + 관리자(Admin)
- **접근 제어**: 관리자 승인 기반
- **예상 규모**: 초기 10-50명

#### 데이터 특성
- **이미지 파일**: JPG, PNG (최대 10MB) → Supabase Storage 저장
- **데이터베이스**:
  - 이미지 메타데이터
  - Google Vision API 분석 결과 (텍스트/JSON)
  - 사용자 활동 로그
  - 컬렉션 관리 정보

#### 주요 워크로드
- **읽기 중심**: 콘텐츠 리스트 조회, 발견 결과 확인
- **간헐적 쓰기**: 이미지 업로드, API 분석 결과 저장
- **페이지네이션**: 20개/페이지 (메모리 부담 낮음)

### 2. 데이터베이스 부하 예측

#### 주요 테이블
```
- users (사용자 계정)
- collections (콘텐츠 그룹)
- contents (업로드 이미지 메타데이터)
- analysis_results (Google Vision API 결과)
- detected_contents (발견된 유사 콘텐츠)
- activity_logs (사용자 활동 로그)
```

#### 예상 동시 접속
- **초기**: 10-20명
- **성장기**: 50-100명
- **확장기**: 200-500명

#### 주요 쿼리 패턴
```sql
-- 읽기 중심 (80%)
SELECT * FROM contents
WHERE user_id = ? AND status = ?
ORDER BY uploaded_at DESC
LIMIT 20 OFFSET ?;

-- 쓰기 (20%)
INSERT INTO analysis_results (content_id, labels, texts, web_detection)
VALUES (?, ?, ?, ?);

UPDATE detected_contents
SET review_status = ?
WHERE id = ?;
```

#### 예상 DB 크기
- **초기 (1-3개월)**: 1-5GB
- **성장기 (3-12개월)**: 5-30GB
- **확장기 (12개월+)**: 30-100GB

### 3. 병목 지점 분석

#### ✅ 부하가 낮은 영역
- **Google Vision API 호출**: 외부 API로 DB 부하 없음
- **이미지 저장**: Supabase Storage 사용으로 DB 부하 최소화
- **페이지네이션**: 20개 단위로 메모리 효율적

#### ⚠️ 주의가 필요한 영역
- **관리자 검토 페이지**: 복잡한 JOIN 쿼리 가능성
- **대시보드 통계**: 집계 쿼리 (COUNT, GROUP BY, SUM)
- **검색/필터링**: 여러 조건의 WHERE 절

---

## 💡 추천 Compute Size

## ✨ **Micro Compute** (기본 추천)

### 📋 사양
| 항목 | 사양 |
|------|------|
| **CPU** | 2-core ARM (shared) |
| **Memory** | 1 GB |
| **Max DB Size** | 10 GB (권장) |
| **Max Connections** | 60 |
| **Connection Pooler** | 200 clients |
| **Disk IOPS** | 500 |
| **Disk Throughput** | 87 Mbps |

### 💰 비용 구조
- **시간당 비용**: $0.01344
- **월간 비용**: ~$10
- **Pro Plan**: $25/월
- **Compute Credits**: -$10/월 (포함)
- **실질 총 비용**: **$25/월**

### ✅ Micro를 추천하는 5가지 이유

1. **적절한 메모리**: 1GB는 초기 단계 웹 애플리케이션에 충분
   - 읽기 중심 워크로드
   - 페이지네이션으로 메모리 사용 최적화
   - 60개 동시 연결 지원

2. **비용 효율성**: Pro Plan의 $10 Compute Credits로 완전히 커버
   - 추가 compute 비용 없음
   - 다른 리소스(Storage, Egress)에 예산 집중 가능

3. **확장 가능성**: 필요시 다운타임 최소화하며 업그레이드 가능
   - 보통 2분 이내 업그레이드 완료
   - 시간당 과금으로 유연한 크기 조정

4. **읽기 중심 워크로드에 최적**:
   - 복잡한 쓰기 작업 없음
   - 대부분 단순 SELECT 쿼리
   - 인덱스 최적화로 성능 보완 가능

5. **외부 API 의존**:
   - Google Vision API가 주요 처리 담당
   - DB는 결과 저장만 수행
   - CPU/메모리 부담 최소화

---

## 📈 성장 단계별 Compute Size 로드맵

### Phase 1: MVP/초기 (현재) - **Micro**

**목표 지표**
- 사용자: 10-50명
- DB 크기: < 5GB
- 동시 연결: < 30

**비용**
- Pro Plan: $25/월
- Compute: $10/월 (Credits로 커버)
- **총 비용: $25/월**

**특징**
- Pro Plan Compute Credits로 추가 비용 없음
- 초기 개발 및 테스트에 충분한 성능
- 모니터링 통해 업그레이드 시점 파악

---

### Phase 2: 성장기 - **Small** 고려

**업그레이드 신호**
- ⚠️ CPU 사용률 지속적으로 > 70%
- ⚠️ 쿼리 응답 시간 증가 (> 500ms)
- ⚠️ Connection pool 부족 경고 (> 50/60)
- ⚠️ 피크 시간대 성능 저하

**목표 지표**
- 사용자: 50-200명
- DB 크기: 5-30GB
- 동시 연결: 50-80

**Small Compute 사양**
| 항목 | 사양 |
|------|------|
| CPU | 2-core ARM (shared) |
| Memory | 2 GB |
| Max DB Size | 50 GB |
| Max Connections | 90 |
| Disk IOPS | 1,000 |

**비용**
- Compute: $15/월
- Compute Credits: -$10/월
- **추가 비용: +$5/월 (총 $30/월)**

---

### Phase 3: 확장기 - **Medium** 고려

**업그레이드 신호**
- 🚨 복잡한 집계 쿼리 느림 (> 2초)
- 🚨 메모리 부족 경고 (OOM 에러)
- 🚨 IOPS 한계 도달 (Disk IO 100%)
- 🚨 피크 시간대 서비스 불안정

**목표 지표**
- 사용자: 200-500명
- DB 크기: 30-80GB
- 동시 연결: 80-120

**Medium Compute 사양**
| 항목 | 사양 |
|------|------|
| CPU | 2-core ARM (shared) |
| Memory | 4 GB |
| Max DB Size | 100 GB |
| Max Connections | 120 |
| Disk IOPS | 2,000 |

**비용**
- Compute: $60/월
- Compute Credits: -$10/월
- **추가 비용: +$50/월 (총 $75/월)**

---

## 🔍 모니터링 지표 및 알림 설정

### 1. CPU Utilization

**모니터링 위치**: Supabase Dashboard → Reports → Infrastructure

**기준치**
- ✅ **정상**: < 50%
- ⚠️ **주의**: 50-70% (피크 시간대만)
- 🚨 **위험**: > 70% (지속적)
- 🔥 **긴급**: > 90%

**조치 사항**
```
70% 이상 지속 → Small 업그레이드 고려
90% 이상 → 즉시 업그레이드 필요
```

### 2. Memory Usage

**모니터링 위치**: Supabase Dashboard → Reports → Infrastructure

**기준치**
- ✅ **정상**: < 60%
- ⚠️ **주의**: 60-80%
- 🚨 **위험**: > 80%
- 🔥 **긴급**: OOM 에러 발생

**조치 사항**
```
80% 이상 → 쿼리 최적화 및 업그레이드 준비
OOM 에러 → 즉시 업그레이드
```

### 3. Disk IO % Consumed

**모니터링 위치**: Supabase Dashboard → Reports → Disk

**기준치**
- ✅ **정상**: 0% (베이스라인 이내)
- ⚠️ **주의**: > 1% (burst 사용)
- 🚨 **위험**: > 50% (빈번한 burst)
- 🔥 **긴급**: 100% (IO 예산 소진)

**조치 사항**
```
> 1% → 쿼리 최적화 및 인덱스 검토
> 50% → 업그레이드 고려
100% → 즉시 업그레이드
```

### 4. Database Connections

**모니터링 위치**: Supabase Dashboard → Reports → Database

**Micro 한계**: 60 connections

**기준치**
- ✅ **정상**: < 30 (50%)
- ⚠️ **주의**: 30-50 (50-83%)
- 🚨 **위험**: > 50 (83%)
- 🔥 **긴급**: 60에 도달

**조치 사항**
```
> 50 지속적 사용 → Small 업그레이드 고려
Connection pool 에러 → Connection pooling 설정 확인
```

### 5. Query Performance

**모니터링 방법**: Application logs + Supabase Logs

**기준치**
- ✅ **정상**: < 200ms (간단한 쿼리)
- ⚠️ **주의**: 200-500ms
- 🚨 **위험**: > 500ms (간단한 쿼리)
- 🔥 **긴급**: > 2초 (타임아웃 발생)

**조치 사항**
```
> 500ms → EXPLAIN ANALYZE로 쿼리 분석
인덱스 최적화 후에도 느림 → 업그레이드 고려
```

---

## ⚙️ 성능 최적화 가이드

### 1. 인덱스 최적화

#### 필수 인덱스
```sql
-- 콘텐츠 조회 (사용자별, 상태별)
CREATE INDEX idx_contents_user_id ON contents(user_id);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_uploaded_at ON contents(uploaded_at DESC);

-- 발견 콘텐츠 검토 상태
CREATE INDEX idx_detected_review_status ON detected_contents(review_status);
CREATE INDEX idx_detected_content_id ON detected_contents(content_id);

-- 분석 결과 조회
CREATE INDEX idx_analysis_content_id ON analysis_results(content_id);
CREATE INDEX idx_analysis_created_at ON analysis_results(created_at DESC);

-- 사용자 조회 (관리자)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

#### 복합 인덱스 (자주 함께 사용되는 컬럼)
```sql
-- 사용자별 콘텐츠 상태 조회
CREATE INDEX idx_contents_user_status ON contents(user_id, status);

-- 날짜 범위 + 상태 필터링
CREATE INDEX idx_contents_status_date ON contents(status, uploaded_at DESC);

-- 관리자 검토 페이지
CREATE INDEX idx_detected_content_status ON detected_contents(content_id, review_status);
```

#### 인덱스 확인
```sql
-- 인덱스 사용 확인
EXPLAIN ANALYZE SELECT * FROM contents
WHERE user_id = 'xxx' AND status = 'pending'
ORDER BY uploaded_at DESC
LIMIT 20;

-- 인덱스 목록 조회
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 2. Connection Pooling 설정

#### Supabase Connection Pooler 사용

**장점**
- Direct connection: 60개 제한
- Pooler: 200개 클라이언트 지원
- Transaction mode와 Session mode 선택 가능

**설정 방법**
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Pooler를 사용하는 클라이언트 (Transaction mode)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Server-side에서 사용 (더 많은 연결 필요시)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

#### Next.js API Routes에서 최적화
```typescript
// app/api/contents/route.ts
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return Response.json(data)
  } catch (error) {
    console.error('Error fetching contents:', error)
    return Response.json({ error: 'Failed to fetch contents' }, { status: 500 })
  }
}
```

### 3. 캐싱 전략

#### 클라이언트 사이드 캐싱 (React Query)
```typescript
// lib/hooks/useContents.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export function useContents(userId: string, status?: string) {
  return useQuery({
    queryKey: ['contents', userId, status],
    queryFn: async () => {
      let query = supabase
        .from('contents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
  })
}
```

#### 서버 사이드 캐싱 (Next.js)
```typescript
// app/api/stats/route.ts
import { NextRequest } from 'next/server'

// Vercel Edge Config 또는 Redis 사용
export async function GET(request: NextRequest) {
  // 5분 캐시
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
```

#### Supabase Realtime 최적화
```typescript
// 필요한 테이블만 구독
const subscription = supabase
  .channel('contents_changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'contents',
      filter: `user_id=eq.${userId}`, // 사용자 데이터만
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

### 4. 쿼리 최적화 패턴

#### Pagination 최적화
```sql
-- ❌ OFFSET 사용 (느림)
SELECT * FROM contents
ORDER BY uploaded_at DESC
LIMIT 20 OFFSET 100;

-- ✅ Cursor-based pagination (빠름)
SELECT * FROM contents
WHERE uploaded_at < '2024-01-01 12:00:00'
ORDER BY uploaded_at DESC
LIMIT 20;
```

#### JOIN 최적화
```sql
-- ❌ 불필요한 데이터 조회
SELECT c.*, u.*, col.*
FROM contents c
JOIN users u ON c.user_id = u.id
JOIN collections col ON c.collection_id = col.id;

-- ✅ 필요한 컬럼만 조회
SELECT
  c.id, c.title, c.uploaded_at,
  u.name as uploader_name,
  col.name as collection_name
FROM contents c
JOIN users u ON c.user_id = u.id
LEFT JOIN collections col ON c.collection_id = col.id;
```

#### COUNT 최적화
```sql
-- ❌ 전체 COUNT (느림)
SELECT COUNT(*) FROM contents;

-- ✅ 근사값 사용 (빠름)
SELECT reltuples::bigint AS estimate
FROM pg_class
WHERE relname = 'contents';
```

### 5. Storage 최적화

#### 이미지 최적화
```typescript
// lib/utils/imageOptimization.ts
export async function optimizeAndUploadImage(
  file: File,
  path: string
): Promise<string> {
  // 클라이언트 사이드에서 리사이징
  const resized = await resizeImage(file, {
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 0.8,
  })

  const { data, error } = await supabase.storage
    .from('contents')
    .upload(path, resized, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error
  return data.path
}
```

#### CDN 활용
```typescript
// 이미지 URL에 transformation 적용
const imageUrl = supabase.storage
  .from('contents')
  .getPublicUrl('image.jpg', {
    transform: {
      width: 400,
      height: 300,
      resize: 'cover',
    },
  })
```

---

## 💰 비용 예측 및 관리

### 월별 비용 시뮬레이션

#### Scenario 1: 초기 단계 (1-3개월)
```
사용자: 20명
일일 업로드: 50개 이미지
DB 크기: 2GB
Egress: 20GB/월

Pro Plan: $25
Compute (Micro): $10 (-$10 Credits) = $0
Storage: 2GB (8GB 포함) = $0
Egress: 20GB (50GB 포함) = $0
---
총 비용: $25/월
```

#### Scenario 2: 성장기 (3-12개월)
```
사용자: 100명
일일 업로드: 200개 이미지
DB 크기: 15GB
Storage: 50GB
Egress: 100GB/월

Pro Plan: $25
Compute (Small): $15 (-$10 Credits) = $5
Storage: 50GB ($0.125/GB × 42GB) = $5.25
Egress: 100GB ($0.09/GB × 50GB) = $4.50
---
총 비용: $39.75/월
```

#### Scenario 3: 확장기 (12개월+)
```
사용자: 500명
일일 업로드: 800개 이미지
DB 크기: 60GB
Storage: 200GB
Egress: 300GB/월

Pro Plan: $25
Compute (Medium): $60 (-$10 Credits) = $50
Storage: 200GB ($0.125/GB × 192GB) = $24
Egress: 300GB ($0.09/GB × 250GB) = $22.50
---
총 비용: $121.50/월
```

### 비용 절감 팁

#### 1. Storage 최적화
- 이미지 압축 (원본 10MB → 2-3MB)
- 썸네일 자동 생성 (리스트 표시용)
- 오래된 분석 결과 아카이빙

#### 2. Egress 최적화
- CDN 캐싱 활용 (Vercel Edge Network)
- 이미지 transformation 사용
- Lazy loading 적용

#### 3. Database 최적화
- 정기적인 VACUUM 실행
- 불필요한 로그 삭제 (30일 이상)
- 인덱스 재구성 (REINDEX)

#### 4. Compute 최적화
- 피크 시간대 파악 후 스케일링
- 쿼리 최적화로 CPU 사용 감소
- Connection pooling으로 연결 효율화

---

## 🎯 최종 추천 및 액션 플랜

### 즉시 조치 사항

#### 1. Supabase Pro Plan 구독
```
✅ Pro Plan 활성화 ($25/월)
✅ Micro Compute 사용 (Compute Credits로 커버)
✅ 기본 설정 확인
```

#### 2. 데이터베이스 최적화
```sql
-- 인덱스 생성
\i /path/to/create_indexes.sql

-- 통계 업데이트
ANALYZE;

-- Vacuum 실행
VACUUM ANALYZE;
```

#### 3. 모니터링 설정
```
✅ Supabase Dashboard 알림 설정
✅ CPU > 70% 알림
✅ Memory > 80% 알림
✅ Connection > 50 알림
```

#### 4. 애플리케이션 최적화
```typescript
✅ React Query 설정
✅ Connection pooling 활성화
✅ 이미지 최적화 구현
✅ 인덱스 활용 확인
```

### 3개월 로드맵

#### Month 1: 초기 설정 및 모니터링
- [x] Pro Plan 구독
- [x] 인덱스 최적화
- [x] 모니터링 대시보드 설정
- [ ] 성능 베이스라인 측정
- [ ] 주간 리포트 검토

#### Month 2: 최적화 및 튜닝
- [ ] 쿼리 성능 분석
- [ ] 캐싱 전략 적용
- [ ] Connection pooling 검증
- [ ] 성능 개선 측정

#### Month 3: 스케일링 준비
- [ ] 트래픽 패턴 분석
- [ ] Small 업그레이드 필요성 평가
- [ ] 비용 최적화 검토
- [ ] 확장 계획 수립

### 업그레이드 체크리스트

#### Small로 업그레이드 시점
- [ ] CPU 사용률 70% 이상 (3일 연속)
- [ ] 쿼리 응답 시간 > 500ms
- [ ] Connection pool 50개 이상 사용
- [ ] 사용자 50명 이상
- [ ] DB 크기 5GB 이상

#### Medium으로 업그레이드 시점
- [ ] CPU 사용률 80% 이상 (3일 연속)
- [ ] 메모리 사용률 80% 이상
- [ ] Disk IO 100% 도달
- [ ] 사용자 200명 이상
- [ ] DB 크기 30GB 이상

---

## 📚 참고 자료

### Supabase 공식 문서
- [Compute and Disk](https://supabase.com/docs/guides/platform/compute-and-disk)
- [Manage Compute Usage](https://supabase.com/docs/guides/platform/manage-your-usage/compute)
- [Performance Optimization](https://supabase.com/docs/guides/platform/performance)
- [Pricing](https://supabase.com/pricing)

### 추가 학습 자료
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Supabase Best Practices](https://supabase.com/docs/guides/platform/best-practices)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

---

## 📞 문의 및 지원

### Supabase 지원
- Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Support: [https://supabase.help](https://supabase.help)
- Community: [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)

### 프로젝트 팀
- 기술적 문제: 개발팀에 문의
- 비용 관련: 관리자에게 문의

---

**마지막 업데이트**: 2025-10-25
**다음 검토 예정**: 2025-11-25 (1개월 후)
