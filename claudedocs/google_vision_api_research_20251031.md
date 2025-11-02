# Google Vision API 사용 가이드

**작성일**: 2025-10-31

---

## 📋 요약

### ✅ 핵심 결론
- **Google Console API Key만으로 Vision API 사용 가능**
- **REST API 직접 호출 방식**
- **Supabase Storage Public URL을 직접 사용** (base64 인코딩 불필요)
- **LABEL_DETECTION, TEXT_DETECTION, WEB_DETECTION 동시 및 개별 요청 지원**

---

## 🔍 Vision API 사용 방법

### 다중 Feature 동시 요청

```javascript
const API_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const API_KEY = process.env.GOOGLE_VISION_API_KEY;

/**
 * Vision API 호출 함수
 * @param {string} imageUrl - 이미지 Public URL
 * @returns {Promise<Object>} Vision API 응답
 */
async function analyzeImage(imageUrl) {
  const requestBody = {
    requests: [
      {
        image: {
          source: {
            imageUri: imageUrl
          }
        },
        features: [
          {
            type: 'LABEL_DETECTION',
            maxResults: 10
          },
          {
            type: 'TEXT_DETECTION'
          },
          {
            type: 'WEB_DETECTION',
            maxResults: 50
          }
        ]
      }
    ]
  };

  const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Vision API 오류: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.responses[0];
}

// 사용 예제
const imageUrl = 'https://your-project.supabase.co/storage/v1/object/public/bucket/image.jpg';
const result = await analyzeImage(imageUrl);

console.log('라벨:', result.labelAnnotations);
console.log('텍스트:', result.textAnnotations);
console.log('웹 정보:', result.webDetection);
```

---

### 개별 Feature 요청

**라벨만 검출:**
```javascript
async function detectLabels(imageUrl) {
  const requestBody = {
    requests: [{
      image: { source: { imageUri: imageUrl } },
      features: [{ type: 'LABEL_DETECTION', maxResults: 10 }]
    }]
  };

  const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  return data.responses[0].labelAnnotations;
}
```

**텍스트만 검출:**
```javascript
async function detectText(imageUrl) {
  const requestBody = {
    requests: [{
      image: { source: { imageUri: imageUrl } },
      features: [{ type: 'TEXT_DETECTION' }]
    }]
  };

  const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  return data.responses[0].textAnnotations;
}
```

**웹 정보만 검출:**
```javascript
async function detectWeb(imageUrl) {
  const requestBody = {
    requests: [{
      image: { source: { imageUri: imageUrl } },
      features: [{ type: 'WEB_DETECTION', maxResults: 50 }]
    }]
  };

  const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  return data.responses[0].webDetection;
}
```

---

## 💡 Next.js API Route 예제

```typescript
// app/api/vision/route.ts

const VISION_API_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY!;

export async function POST(request: Request) {
  const { imageUrl } = await request.json();

  if (!imageUrl) {
    return Response.json({ error: 'imageUrl is required' }, { status: 400 });
  }

  const requestBody = {
    requests: [{
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'TEXT_DETECTION' },
        { type: 'WEB_DETECTION', maxResults: 50 }
      ]
    }]
  };

  const response = await fetch(`${VISION_API_ENDPOINT}?key=${VISION_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  const result = data.responses[0];

  return Response.json({
    labels: result.labelAnnotations || [],
    texts: result.textAnnotations || [],
    webInfo: result.webDetection || {}
  });
}
```

**환경 변수 설정 (.env):**
```bash
GOOGLE_VISION_API_KEY=your_api_key_here
```

---

## ⚠️ 주의사항

### Feature별 maxResults 설정
- **LABEL_DETECTION**: `maxResults: 10`
- **TEXT_DETECTION**: `maxResults` 설정 불가 (모든 텍스트 반환)
- **WEB_DETECTION**: `maxResults: 50`

### 이미지 URL 요구사항
- 이미지는 **공개적으로 접근 가능**해야 함
- 지원 형식: JPEG, PNG, GIF, BMP, WEBP, RAW, ICO, PDF, TIFF
- 최대 크기: 20MB, 75 megapixels

### 보안
- API Key를 환경변수로 관리 (`process.env.GOOGLE_VISION_API_KEY`)
- `.env` 파일을 `.gitignore`에 추가
- Google Console에서 API Key 제한 설정

### 비용
- 무료 할당량: 월 1,000개 요청
- 추가 요청: $1.50~$3.50/요청 (feature 타입에 따라 다름)

---

## 🎯 설정 단계

1. Google Cloud Console에서 Vision API 활성화
2. API Key 생성
3. 환경변수로 API Key 설정
4. 위 코드 예제를 사용하여 구현
