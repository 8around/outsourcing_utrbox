# 023_회원_관리_페이지_UI_UX_개선_계획

## 1. 개요

### 1.1 목적
회원 관리 페이지의 사용성과 반응형 디자인을 개선하여 더 나은 관리자 경험을 제공합니다.

### 1.2 개선 범위
- 로딩 상태 UI 개선 (필터/테이블 분리)
- 일괄 작업 버튼 레이아웃 개선
- 테이블 반응형 디자인 개선
- 페이지 컨텐츠 최소 너비 설정

---

## 2. 현재 문제점 분석

### 2.1 전체 페이지 로딩 문제
**현재 동작** (`app/admin/users/page.tsx:117-123`):
```typescript
if (loading) {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  )
}
```

**문제점**:
- `loading` state가 `true`일 때 페이지 전체(필터 포함)가 로딩 화면으로 교체됨
- 필터 조작 시: `userFilters` 변경 → `useEffect` 트리거 → `loading=true` → 전체 화면 로딩
- 사용자가 필터를 변경할 때마다 필터 UI가 사라지고 로딩 스피너만 표시됨
- 사용자 경험 저하: 필터 상태가 시각적으로 유지되지 않음

**개선 필요 사항**:
- 필터 영역은 항상 렌더링 유지
- 테이블 영역에 스켈레톤 UI 표시 (로딩 스피너 대신)

---

### 2.2 일괄 작업 버튼 조건부 렌더링 문제
**현재 동작** (`components/admin/users/UserTableClient.tsx:187-219`):
```typescript
{selectedIds.length > 0 && (
  <div className="flex items-center gap-2 rounded-lg border bg-blue-50 p-3">
    <span className="text-sm font-medium text-gray-700">
      {selectedIds.length}명 선택됨
    </span>
    <div className="ml-auto flex gap-2">
      <Button>일괄 승인</Button>
      <Button>일괄 차단</Button>
    </div>
  </div>
)}
```

**문제점**:
- `selectedIds.length > 0` 조건으로 버튼 영역이 조건부 렌더링됨
- 선택 시에만 버튼이 나타나 레이아웃이 변경됨 (CLS 발생 가능)
- 푸른 배경(`bg-blue-50`)과 선택 인디케이터가 함께 있어 시각적으로 복잡함
- 사용자가 버튼 위치를 예측하기 어려움

**개선 필요 사항**:
- 버튼을 항상 렌더링 (레이아웃 고정)
- 푸른 배경과 선택 인디케이터 제거
- 선택된 항목이 없을 때는 버튼을 `disabled` 처리
- 깔끔하고 일관된 UI 제공

---

### 2.3 테이블 텍스트 줄바꿈 문제
**현재 동작**:
- 테이블 컬럼에 `minWidth` 설정이 없음
- 창 너비가 줄어들면 텍스트가 자동으로 여러 줄로 표시됨
- 특히 이메일, 이름, 소속 등의 긴 텍스트가 2줄 이상으로 표시될 수 있음

**문제점**:
- 테이블 행 높이가 불규칙하게 증가
- 가독성 저하 및 시각적 혼란
- 전문적이지 않은 외관

**개선 필요 사항**:
- 각 컬럼에 적절한 `minWidth` 설정
- 텍스트 오버플로우 처리 (`truncate` 또는 `ellipsis`)
- 테이블 전체에 최소 너비 설정
- 필요시 가로 스크롤 가능하도록 설정

---

### 2.4 페이지 컨텐츠 최소 너비 미설정 문제
**현재 동작**:
- 페이지 컨텐츠에 `minWidth` 설정이 없음
- 브라우저 창이 좁아지면 레이아웃이 과도하게 압축됨

**문제점**:
- 화면이 너무 좁을 때 UI 요소들이 읽기 어려워짐
- 테이블과 필터가 제대로 작동하지 않을 수 있음

**개선 필요 사항**:
- 페이지 컨텐츠(Header, Footer 제외)에 `minWidth: 750px` 설정
- 반응형 처리를 위해 `overflow-x-auto` 추가

---

## 3. 개선 방안 설계

### 3.1 로딩 상태 스켈레톤 UI 설계

#### 3.1.1 아키텍처 변경
```
[현재]
loading === true
  └── 전체 화면 로딩 (필터 + 테이블 모두 사라짐)

[개선 후]
필터 영역 (항상 렌더링)
  └── UserFilters 컴포넌트
테이블 영역
  └── loading === true
      ├── 스켈레톤 테이블 행 표시 (10개)
      └── loading === false
          └── 실제 데이터 렌더링
```

#### 3.1.2 구현 방법
1. **page.tsx 수정**:
   - 전체 페이지 로딩 제거
   - 필터는 항상 렌더링
   - `loading` state를 `UserTableClient`에 props로 전달

2. **UserTableClient.tsx 수정**:
   - `loading` props 추가
   - 로딩 상태일 때 단순 스켈레톤 행(skeleton rows) 렌더링
   - 스켈레톤 행은 `pageSize` 개수만큼 표시 (기본 10개)
   - 각 행은 `colSpan`으로 병합된 하나의 회색 박스로 표시
   - `animate-pulse` 애니메이션으로 로딩 상태 표현
   - 로딩이 아닐 때 정상 테이블 렌더링

3. **스켈레톤 UI 구현** (단순화):
   ```tsx
   {loading ? (
     <TableBody>
       {Array.from({ length: pageSize }).map((_, index) => (
         <TableRow key={`skeleton-${index}`}>
           <TableCell colSpan={columns.length}>
             <div className="h-10 bg-gray-100 rounded animate-pulse" />
           </TableCell>
         </TableRow>
       ))}
     </TableBody>
   ) : (
     <TableBody>
       {/* 실제 데이터 렌더링 */}
     </TableBody>
   )}
   ```

   **설명**: 각 행을 하나의 `colSpan`으로 병합하여 단순한 회색 박스로 표시. 테이블의 윤곽만 나타내어 깔끔한 로딩 상태 표현.

---

### 3.2 일괄 작업 버튼 레이아웃 개선 설계

#### 3.2.1 UI 디자인
```
[현재]
선택 시에만 표시:
┌─────────────────────────────────────────┐
│ 🔵 3명 선택됨    [일괄 승인] [일괄 차단] │
└─────────────────────────────────────────┘

[개선 후]
항상 표시:
[일괄 승인] [일괄 차단]  (선택: 0명)
```

#### 3.2.2 구현 방법
1. **조건부 렌더링 제거**:
   - `selectedIds.length > 0` 조건 제거
   - 버튼을 항상 렌더링

2. **배경 및 인디케이터 제거**:
   - `bg-blue-50`, `border`, `rounded-lg` 클래스 제거
   - 선택 개수 인디케이터 제거

3. **버튼 상태 제어**:
   - `disabled={selectedIds.length === 0}` 추가
   - 선택된 항목이 없으면 버튼 비활성화

4. **레이아웃 위치**:
   - 테이블 상단, 우측 정렬
   - 간단하고 깔끔한 레이아웃

---

### 3.3 테이블 반응형 개선 설계

#### 3.3.1 테이블 구조
```typescript
// 컬럼별 너비 설정
const columns = [
  { id: 'select', width: '50px' },      // 체크박스
  { id: 'name', minWidth: '100px' },    // 이름
  { id: 'email', minWidth: '180px' },   // 이메일
  { id: 'organization', minWidth: '120px' }, // 소속
  { id: 'is_approved', width: '90px' }, // 상태
  { id: 'role', width: '90px' },        // 역할
  { id: 'created_at', minWidth: '120px' }, // 가입일
  { id: 'actions', width: '80px' },     // 작업
]
```

#### 3.3.2 스타일링 전략
1. **테이블 래퍼**:
   - `overflow-x-auto`: 가로 스크롤 활성화
   - `min-w-[750px]`: 최소 너비 설정

2. **테이블 셀**:
   - 각 컬럼에 `minWidth` 또는 `width` 설정
   - 텍스트 오버플로우는 `truncate` 처리
   - `whitespace-nowrap`: 텍스트 줄바꿈 방지

3. **반응형 동작**:
   - 창 너비 ≥ 750px: 정상 표시
   - 창 너비 < 750px: 가로 스크롤 표시

---

### 3.4 페이지 레이아웃 개선 설계

#### 3.4.1 레이아웃 구조
```tsx
<div className="min-w-[750px] space-y-6">
  {/* 필터 */}
  <UserFilters />

  {/* 테이블 */}
  <UserTableClient loading={loading} />
</div>
```

#### 3.4.2 스타일링
- 페이지 컨텐츠 최상위 `div`에 `min-w-[750px]` 적용
- Header, Footer는 제외 (요구사항에 명시)
- 부모 레이아웃에서 `overflow-x-auto` 처리 (필요시)

---

## 4. 구현 상세 내역

### 4.1 파일 수정 목록

#### 4.1.1 `app/admin/users/page.tsx`
**수정 내용**:
1. 전체 페이지 로딩 조건문 제거 (117-123줄)
2. `loading` state를 `UserTableClient`에 props로 전달
3. 페이지 컨텐츠 최상위 `div`에 `min-w-[750px]` 추가

**변경 전**:
```typescript
if (loading) {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  )
}

return (
  <div className="space-y-6">
    <UserFilters filters={userFilters} onFilterChange={setUserFilters} />
    <UserTableClient
      users={users}
      totalCount={totalCount}
      currentPage={userFilters.page}
      pageSize={10}
      onPageChange={handlePageChange}
      onBulkApprove={handleBulkApprove}
      onBulkBlock={handleBulkBlock}
    />
  </div>
)
```

**변경 후**:
```typescript
return (
  <div className="min-w-[750px] space-y-6">
    <UserFilters filters={userFilters} onFilterChange={setUserFilters} />
    <UserTableClient
      users={users}
      totalCount={totalCount}
      currentPage={userFilters.page}
      pageSize={10}
      loading={loading}
      onPageChange={handlePageChange}
      onBulkApprove={handleBulkApprove}
      onBulkBlock={handleBulkBlock}
    />
  </div>
)
```

---

#### 4.1.2 `components/admin/users/UserTableClient.tsx`
**수정 내용**:
1. `loading` props 추가
2. 일괄 작업 버튼을 항상 렌더링하도록 변경
3. 푸른 배경과 선택 인디케이터 제거
4. 테이블 래퍼에 `overflow-x-auto`, `min-w-[750px]` 추가
5. 각 컬럼에 `minWidth` 설정
6. 텍스트 셀에 `truncate`, `whitespace-nowrap` 추가
7. 로딩 상태일 때 테이블 영역에 로딩 스피너 표시

**Props 인터페이스 수정**:
```typescript
interface UserTableClientProps {
  users: User[]
  totalCount: number
  currentPage: number
  pageSize: number
  loading: boolean // 추가
  onPageChange: (page: number) => void
  onBulkApprove: (userIds: string[]) => void
  onBulkBlock: (userIds: string[]) => void
}
```

**일괄 작업 버튼 개선**:
```typescript
// 변경 전
{selectedIds.length > 0 && (
  <div className="flex items-center gap-2 rounded-lg border bg-blue-50 p-3">
    <span className="text-sm font-medium text-gray-700">
      {selectedIds.length}명 선택됨
    </span>
    <div className="ml-auto flex gap-2">
      <Button>일괄 승인</Button>
      <Button>일괄 차단</Button>
    </div>
  </div>
)}

// 변경 후
<div className="flex items-center justify-end gap-2">
  <Button
    size="sm"
    variant="outline"
    disabled={selectedIds.length === 0}
    onClick={() => {
      onBulkApprove(selectedIds)
      setRowSelection({})
    }}
    className="gap-1"
  >
    <CheckCircle className="h-4 w-4" />
    일괄 승인
  </Button>
  <Button
    size="sm"
    variant="outline"
    disabled={selectedIds.length === 0}
    onClick={() => {
      onBulkBlock(selectedIds)
      setRowSelection({})
    }}
    className="gap-1 text-red-600 hover:text-red-700"
  >
    <XCircle className="h-4 w-4" />
    일괄 차단
  </Button>
  {selectedIds.length > 0 && (
    <span className="text-sm text-gray-500">
      (선택: {selectedIds.length}명)
    </span>
  )}
</div>
```

**테이블 컬럼 너비 설정**:
```typescript
const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => <Checkbox />,
    cell: ({ row }) => <Checkbox />,
    size: 50, // 체크박스
  },
  {
    accessorKey: 'name',
    header: '이름',
    cell: ({ row }) => (
      <div className="min-w-[100px] truncate font-medium">
        {row.getValue('name')}
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: '이메일',
    cell: ({ row }) => (
      <div className="min-w-[180px] truncate text-gray-600">
        {row.getValue('email')}
      </div>
    ),
  },
  {
    accessorKey: 'organization',
    header: '소속',
    cell: ({ row }) => (
      <div className="min-w-[120px] truncate text-gray-600">
        {row.getValue('organization') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'is_approved',
    header: '상태',
    cell: ({ row }) => (
      <div className="w-[90px]">
        {getStatusBadge(row.getValue('is_approved'))}
      </div>
    ),
    size: 90,
  },
  {
    accessorKey: 'role',
    header: '역할',
    cell: ({ row }) => (
      <div className="w-[90px]">
        {getRoleBadge(row.getValue('role'))}
      </div>
    ),
    size: 90,
  },
  {
    accessorKey: 'created_at',
    header: '가입일',
    cell: ({ row }) => (
      <div className="min-w-[120px] truncate text-gray-600">
        {format(new Date(row.getValue('created_at')), 'PPP', { locale: ko })}
      </div>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right">작업</div>,
    cell: ({ row }) => (
      <div className="w-[80px] text-right">
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
          상세
        </Button>
      </div>
    ),
    size: 80,
  },
]
```

**로딩 상태 처리 (단순 스켈레톤 UI)**:
```typescript
return (
  <div className="space-y-4">
    {/* 일괄 작업 버튼 (항상 렌더링) */}
    <div className="flex items-center justify-end gap-2">
      {/* 버튼들... */}
    </div>

    {/* 테이블 */}
    <div className="overflow-x-auto rounded-lg border bg-white">
      <Table className="min-w-[750px]">
        <TableHeader>
          {/* 헤더는 항상 표시 */}
        </TableHeader>
        {loading ? (
          <TableBody>
            {Array.from({ length: pageSize }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={columns.length}>
                  <div className="h-10 bg-gray-100 rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        ) : (
          <TableBody>
            {/* 실제 데이터 렌더링 */}
          </TableBody>
        )}
      </Table>
    </div>

    {/* 페이지네이션 */}
    <div className="flex items-center justify-between">
      {/* 페이지네이션 컨트롤... */}
    </div>
  </div>
)
```

---

### 4.2 타입 정의 수정

#### `components/admin/users/UserTableClient.tsx` 인터페이스
```typescript
interface UserTableClientProps {
  users: User[]
  totalCount: number
  currentPage: number
  pageSize: number
  loading: boolean // 추가
  onPageChange: (page: number) => void
  onBulkApprove: (userIds: string[]) => void
  onBulkBlock: (userIds: string[]) => void
}
```

---

## 5. 테스트 계획

### 5.1 로딩 상태 테스트 (단순 스켈레톤 UI)
**테스트 시나리오**:
1. 회원 관리 페이지 접속
2. 필터 조건 변경 (검색어 입력)
3. 로딩 중일 때 필터 영역이 여전히 표시되는지 확인
4. 테이블 헤더가 유지되는지 확인
5. 테이블 본문에 10개의 단순 스켈레톤 행이 표시되는지 확인
   - 각 행은 하나의 회색 박스(`bg-gray-100`)로 표시
   - `animate-pulse` 애니메이션 적용
6. 로딩 완료 후 테이블이 실제 데이터로 교체되는지 확인

**예상 결과**:
- 필터는 항상 화면에 표시됨
- 테이블 헤더 유지, 본문은 단순한 스켈레톤 행으로 표시
- 깔끔하고 간결한 로딩 상태 표현
- 사용자 경험 향상

---

### 5.2 일괄 작업 버튼 테스트
**테스트 시나리오**:
1. 회원 관리 페이지 접속
2. 아무것도 선택하지 않은 상태에서 버튼이 표시되는지 확인
3. 버튼이 비활성화(`disabled`) 상태인지 확인
4. 회원 1명 선택
5. 버튼이 활성화되고 "(선택: 1명)" 텍스트가 표시되는지 확인
6. 일괄 승인 버튼 클릭
7. 선택 해제 후 버튼이 다시 비활성화되는지 확인

**예상 결과**:
- 버튼은 항상 렌더링됨
- 선택 없을 때 비활성화, 선택 있을 때 활성화
- 푸른 배경 없이 깔끔한 UI
- 레이아웃 변경 없음 (CLS 방지)

---

### 5.3 테이블 반응형 테스트
**테스트 시나리오**:
1. 회원 관리 페이지 접속
2. 브라우저 창 너비를 1200px → 900px → 750px → 600px로 축소
3. 각 단계에서 테이블 렌더링 확인

**예상 결과**:
- 창 너비 ≥ 750px: 테이블 정상 표시
- 창 너비 < 750px: 가로 스크롤바 표시
- 모든 텍스트가 한 줄로 표시됨 (줄바꿈 없음)
- 긴 텍스트는 `...`으로 truncate 처리

---

### 5.4 페이지 레이아웃 테스트
**테스트 시나리오**:
1. 회원 관리 페이지 접속
2. 브라우저 창 너비를 500px까지 축소
3. 페이지 컨텐츠의 최소 너비가 750px로 유지되는지 확인
4. Header, Footer는 반응형으로 축소되는지 확인

**예상 결과**:
- 페이지 컨텐츠(필터 + 테이블)는 최소 750px 유지
- 필요시 가로 스크롤 표시
- Header, Footer는 정상 동작

---

## 6. 예상 효과

### 6.1 사용자 경험 개선
- **필터 영역 유지**: 로딩 중에도 필터가 화면에 표시되어 사용자가 현재 상태를 인지 가능
- **단순 스켈레톤 UI**: 테이블의 윤곽만 표시하여 간결하고 자연스러운 로딩 경험 제공
- **일관된 레이아웃**: 버튼이 항상 같은 위치에 있어 사용자가 예측 가능
- **깔끔한 UI**: 불필요한 배경과 인디케이터 제거로 시각적 혼란 감소

### 6.2 성능 개선
- **CLS(Cumulative Layout Shift) 감소**: 버튼이 항상 렌더링되어 레이아웃 변경 없음
- **불필요한 재렌더링 감소**: 필터 영역이 로딩 시에도 재렌더링되지 않음

### 6.3 반응형 디자인 개선
- **가독성 향상**: 텍스트 줄바꿈 방지로 테이블 가독성 향상
- **일관된 디자인**: 최소 너비 설정으로 모든 화면 크기에서 일관된 디자인 제공

### 6.4 유지보수성 향상
- **명확한 로딩 로직**: 로딩 상태가 컴포넌트별로 분리되어 유지보수 용이
- **단순한 버튼 로직**: 조건부 렌더링 제거로 코드 복잡도 감소

---

## 7. 구현 순서

1. **1단계**: `UserTableClient.tsx` 인터페이스 수정 (`loading` props 추가)
2. **2단계**: `UserTableClient.tsx` 일괄 작업 버튼 레이아웃 개선
3. **3단계**: `UserTableClient.tsx` 테이블 컬럼 너비 및 스타일 설정
4. **4단계**: `UserTableClient.tsx` 로딩 상태 처리 로직 추가
5. **5단계**: `page.tsx` 전체 페이지 로딩 제거 및 `loading` props 전달
6. **6단계**: `page.tsx` 페이지 컨텐츠 `minWidth` 설정
7. **7단계**: 빌드 및 타입 체크
8. **8단계**: 브라우저에서 기능 테스트

---

## 8. 주의사항

### 8.1 스타일링
- Tailwind CSS 클래스만 사용
- 인라인 스타일 지양
- 기존 디자인 시스템과 일관성 유지

### 8.2 타입 안정성
- `loading` props는 `boolean` 타입으로 명확히 정의
- TypeScript strict 모드에서 빌드 에러 없도록 처리

### 8.3 브라우저 호환성
- 모든 모던 브라우저에서 `min-w-[750px]`, `overflow-x-auto` 정상 작동
- CSS Grid, Flexbox 호환성 확인

---

## 9. 완료 기준

- [ ] 필터 조작 시 필터 영역은 유지되고 테이블만 스켈레톤 UI로 표시
- [ ] 스켈레톤 UI는 10개의 단순한 회색 박스 행으로 표시 (`animate-pulse` 애니메이션)
- [ ] 테이블 헤더는 로딩 중에도 유지
- [ ] 일괄 작업 버튼이 항상 렌더링되며, 푸른 배경과 인디케이터 제거
- [ ] 선택된 회원이 없을 때 버튼 비활성화
- [ ] 테이블 셀 텍스트가 한 줄로 표시됨 (줄바꿈 없음)
- [ ] 페이지 컨텐츠 최소 너비 750px 설정
- [ ] 창 너비 < 750px일 때 가로 스크롤 정상 작동
- [ ] 빌드 및 타입 체크 에러 없음
- [ ] 모든 테스트 시나리오 통과

---

_이 문서는 회원 관리 페이지의 UI/UX 개선을 위한 상세 계획을 정의합니다._
