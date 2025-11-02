## 목적

- 브라우저 CORS 제약을 우회하기 위해 서버(Next.js API Route)에서 대상 URL에 대해 HEAD 요청으로 `Content-Type` 확인
- 일부 서버가 HEAD를 차단하거나 헤더가 부정확한 경우를 대비해 가벼운 폴백(부분 GET + MIME 스니핑)까지 수행
- 우리 서비스의 다른 라우트들과 동일한 인증 흐름(세션 검사) 적용
- 보안 참고: 본 계획에서는 SSRF 방어 로직은 제외(요구사항). 운영 반영 시에는 별도 규칙으로 관리 권장

## 엔드포인트

- Method: `GET`
- Path: `/api/utils/image-head`
- Query: `url` (검증 대상의 절대 URL)

## 인증(세션 검사) 정책

- 기존 라우트와 동일하게 Supabase 서버 클라이언트를 사용하여 세션 검사
- 패턴: `createServerSupabase()` → `supabase.auth.getSession()` → 세션 없으면 401 반환
- 참고 구현 패턴은 아래 라우트들과 동일
  - `app/api/vision/analyze/route.ts`
  - `app/api/vision/redetect/route.ts`
  - `app/api/detected-contents/[id]/review/route.ts`

## 요청/응답 스펙

- Request
  - `GET /api/utils/image-head?url=<encoded>`

- Response(JSON)
  - 성공(이미지로 판정)
    ```json
    { "ok": true, "mime": "image/jpeg", "via": "head|range-get|sniff" }
    ```
  - 실패(이미지 아님 또는 판별 불가)
    ```json
    { "ok": false, "status": 404 }
    ```
  - 인증 실패
    ```json
    { "error": "인증이 필요합니다." }
    ```

## 동작 흐름

1. 세션 검사 실패 시 401 반환
2. `url` 쿼리 파라미터 검증(비어있으면 400)
3. 우선 `HEAD` 요청 수행, `Content-Type`이 `image/*`로 시작하면 성공
4. `HEAD` 실패 또는 부정확할 경우, `Range: bytes=0-96`로 소량 `GET` 요청
   - 응답 `Content-Type` 확인
   - 필요 시 응답 바이트의 매직 넘버로 이미지 포맷 스니핑(JPEG/PNG/GIF/WebP/AVIF/BMP/TIFF)
5. 최종 판정 결과를 JSON으로 반환

## 구현 초안(SSRF 방어 제외)

```typescript
// app/api/utils/image-head/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 6000

export async function GET(req: Request) {
  // 1) 세션 검사
  const supabase = createServerSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  // 2) 입력 파라미터 검증
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url') || ''
  if (!url) {
    return NextResponse.json({ ok: false, error: 'Missing url' }, { status: 400 })
  }

  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    // 3) HEAD 요청으로 Content-Type 확인
    try {
      const headRes = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'User-Agent': 'utrbox-image-check/1.0' },
      })

      if (headRes.ok) {
        const ct = headRes.headers.get('content-type')?.toLowerCase() || ''
        if (ct.startsWith('image/')) {
          return NextResponse.json({ ok: true, mime: ct, via: 'head' })
        }
      }
    } catch {
      /* 폴백으로 진행 */
    }

    // 4) Range GET 폴백 + 스니핑
    const getRes = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-96', 'User-Agent': 'utrbox-image-check/1.0' },
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!getRes.ok) {
      return NextResponse.json({ ok: false, status: getRes.status })
    }

    const ct2 = getRes.headers.get('content-type')?.toLowerCase() || ''
    if (ct2.startsWith('image/')) {
      return NextResponse.json({ ok: true, mime: ct2, via: 'range-get' })
    }

    const buf = new Uint8Array(await getRes.arrayBuffer())
    const sniff = sniffImageMime(buf)
    if (sniff) {
      return NextResponse.json({ ok: true, mime: sniff, via: 'sniff' })
    }

    return NextResponse.json({ ok: false })
  } finally {
    clearTimeout(to)
  }
}

function sniffImageMime(b: Uint8Array): string | undefined {
  // JPEG
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  // PNG
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  )
    return 'image/png'
  // GIF
  if (b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38)
    return 'image/gif'
  // WebP: "RIFF....WEBP"
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return 'image/webp'
  // AVIF: ftyp avif/avis
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(...b.slice(8, 12))
    if (brand === 'avif' || brand === 'avis') return 'image/avif'
  }
  // BMP
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) return 'image/bmp'
  // TIFF
  if (
    b.length >= 4 &&
    ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00) ||
      (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a))
  )
    return 'image/tiff'
  return undefined
}
```

## 클라이언트 유틸 예시

```typescript
export async function isWebImageUrlViaApi(url?: string): Promise<boolean> {
  if (!url) return false
  const res = await fetch(`/api/utils/image-head?url=${encodeURIComponent(url)}`, {
    cache: 'no-store',
  })
  if (!res.ok) return false
  const data = await res.json()
  return !!data?.ok
}
```

## 테스트 시나리오

- 인증
  - 비로그인 호출 → 401
  - 로그인 후 호출 → 정상 동작
- 정상 이미지 URL
  - HEAD로 `image/*` 확인 → `via: head`
  - HEAD 405/403/부정확 → Range GET로 `image/*` 확인 → `via: range-get`
  - `Content-Type` 부정확 → 매직 넘버 스니핑으로 판정 → `via: sniff`
- 비이미지 URL → `{ ok: false }`
- 타임아웃/네트워크 오류 → `{ ok: false }` 또는 적절한 status 포함

## 운영 메모(본 계획 범위 밖)

- SSRF 방어(프로토콜 제한, DNS→IP 내부망 차단, 리다이렉트 단계별 재검증 등)는 추후 별도 규칙/미들웨어로 관리 권장
- 특정 도메인(자사 CDN) 화이트리스트, 간단 캐시 전략(짧은 TTL) 고려 가능
- User-Agent 맞춤, 레이트 리밋, 관찰 가능한 로그 필드 추가 고려
