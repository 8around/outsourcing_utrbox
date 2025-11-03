## Google Vision API 오류 코드 가이드

본 문서는 Google Cloud Vision API(Images: Annotate 등) 사용 시 `AnnotateImageResponse.error` 및 공통 API 오류에 대한 의미, 원인, 대응 방법을 요약합니다.

### 오류 응답 구조 개요
예시(JSON):

```json
{
  "error": {
    "code": 7,
    "status": "PERMISSION_DENIED"
  }
}
```

### 자주 발생하는 시나리오

- 결제/크레딧 문제: 403 PERMISSION_DENIED + `BILLING_DISABLED`/`PROJECT_BILLING_DISABLED`
- 쿼터/요금제 한도: `RESOURCE_EXHAUSTED`(HTTP 429 또는 403)
- 요청 형식/파라미터 오류: `INVALID_ARGUMENT`
- 인증/권한 문제: `UNAUTHENTICATED`, `PERMISSION_DENIED`
- 일시 장애/네트워크: `UNAVAILABLE`, `DEADLINE_EXCEEDED`
- 내부 오류: `INTERNAL`

---

## 오류 코드별 의미·원인·대응

> 표의 HTTP 상태는 일반적인 매핑을 나타내며, 실제 응답은 호출 경로/라이브러리에 따라 다를 수 있습니다.

| Code (정수) | Status              | 일반적 HTTP | 의미                  | Vision에서 흔한 원인                                                                                                   | 권장 대응                                           |
| ----------- | ------------------- | ----------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --- | --------------------------------------------- |
| 3           | INVALID_ARGUMENT    | 400         | 잘못된 인수/요청      | 손상/미지원 이미지 포맷, 잘못된 Base64, 잘못된 `imageUri` 또는 `Feature` 조합, 허용 범위 밖 `maxResults`, 이미지 과대( | 픽셀/바이트                                         | )   | 입력 검증, 포맷/크기 제한 준수, 파라미터 수정 |
| 5           | NOT_FOUND           | 404         | 리소스 없음           | `gs://` 경로 오타/존재하지 않음, 외부 URL 404/만료                                                                     | 경로/URL 재검증, 접근성 확인                        |
| 7           | PERMISSION_DENIED   | 403         | 권한 거부             | 프로젝트/IAM 권한 부족, 버킷 ACL/정책 제한, 결제 비활성화(`BILLING_DISABLED`)                                          | IAM/버킷 권한 정정, 결제 계정 활성화, API 사용 설정 |
| 16          | UNAUTHENTICATED     | 401         | 인증 실패             | 잘못된/만료된 자격증명(API 키/OAuth), 환경 구성 오류                                                                   | 자격증명 갱신, 키/토큰·스코프 확인                  |
| 9           | FAILED_PRECONDITION | 400/412     | 선행 조건 불충족      | 조직/프로젝트 정책으로 기능 제한, 잘못된 엔드포인트/리전                                                               | 올바른 엔드포인트/리전 사용, 정책/설정 점검         |
| 11          | OUT_OF_RANGE        | 400         | 범위 초과             | 페이지 번호/좌표 등 허용 범위를 벗어남                                                                                 | 파라미터 범위 조정, 입력 정규화                     |
| 8           | RESOURCE_EXHAUSTED  | 429/403     | 리소스/쿼터 소진      | 요청량(QPS)/일일 쿼터, 동시 처리량 초과                                                                                | 지수 백오프 재시도, 요청 평준화, 쿼터 증설 요청     |
| 4           | DEADLINE_EXCEEDED   | 504         | 처리 시간 초과        | 대형 이미지/복잡한 특징으로 장시간 처리, 네트워크 지연                                                                 | 타임아웃 상향, 이미지 크기 축소, 비동기 처리 검토   |
| 14          | UNAVAILABLE         | 503         | 서비스 일시 불가      | 일시적 서비스 장애/네트워크 문제                                                                                       | 지수 백오프 재시도, 지역/엔드포인트 대안 고려       |
| 13          | INTERNAL            | 500         | 내부 서버 오류        | 처리 파이프라인 내부 예외(예: "Failed to process features")                                                            | 안전한 재시도, 반복 시 지원 문의/로그 첨부          |
| 10          | ABORTED             | 409         | 경합/중단             | 경쟁 상태/재시도 가능 상황                                                                                             | 재시도 로직 적용(백오프/지터)                       |
| 1           | CANCELLED           | 499         | 작업 취소             | 클라이언트 취소/연결 해제                                                                                              | 필요 시 재요청, 취소 원인 추적                      |
| 15          | DATA_LOSS           | 500         | 복구 불가 데이터 손실 | 전송/저장 중 데이터 손상(희귀)                                                                                         | 원본 재전송/재시도, 무결성 검증                     |
| 2           | UNKNOWN             | 500         | 알 수 없는 오류       | 비분류 예외                                                                                                            | 로깅/샘플 수집 후 재시도, 지원 문의                 |
| 12          | UNIMPLEMENTED       | 501         | 미구현/미지원         | 잘못된 메서드/기능 경로 사용                                                                                           | 문서 확인 후 올바른 API/버전 사용                   |

### 오류 코드 별 출력 메시지
2, 8, 10, 15: 요청 중 오류가 발생했습니다. 다시 시도해주세요.
3: 손상되었거나 지원되지 않는 포맷이 이미지입니다. (지원되지 않는 포맷의 이미지를 파일명의 확장자만 변경하는 경우에도 요청이 불가합니다.)
4: 요청 시간이 초과되었습니다. 다시 시도해주세요.
7, 16: Google Vision API 크레딧이 부족하거나 설정이 잘못되었습니다.
12: 지원되지 않는 API를 사용하고 있습니다. 관리자에 문의해주세요.
14: Google Vision API 서버에 문제가 있어 요청을 처리할 수 없습니다.

### 참고 문서

- Vision REST: [AnnotateImageResponse](https://cloud.google.com/vision/docs/reference/rest/v1/AnnotateImageResponse)
- Google API 오류 설계: [Designing Errors](https://cloud.google.com/apis/design/errors)
- 할당량/제한: [Vision usage limits](https://cloud.google.com/vision/quotas)
