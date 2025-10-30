'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAdminTitle } from '@/components/admin/layout/AdminContext'
import { UserDetailCard } from '@/components/admin/users/UserDetailCard'
import { UserActionButtons } from '@/components/admin/users/UserActionButtons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { mockUsers, mockContents } from '@/lib/admin/mock-data'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function AdminUserDetailPage() {
  useAdminTitle('회원 상세')
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  // Mock 사용자 찾기
  const user = mockUsers.find((u) => u.id === userId)

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">회원을 찾을 수 없습니다.</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  // 해당 사용자의 콘텐츠 찾기
  const userContents = mockContents.filter((c) => c.user_id === userId)

  const handleApprove = () => {
    console.log('Approve user:', userId)
    // Mock 승인 - 실제로는 Supabase API 호출
  }

  const handleBlock = () => {
    console.log('Block user:', userId)
    // Mock 차단 - 실제로는 Supabase API 호출
  }

  const handleRoleChange = (role: 'member' | 'admin') => {
    console.log('Change role:', userId, role)
    // Mock 권한 변경 - 실제로는 Supabase API 호출
  }

  const getAnalysisStatusBadge = (isAnalyzed: boolean | null) => {
    if (isAnalyzed === null) {
      return <Badge variant="secondary">대기</Badge>
    } else if (isAnalyzed === false) {
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">분석 중</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">완료</Badge>
    }
  }

  return (
    <div className="space-y-6">
        {/* 뒤로 가기 버튼 */}
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          회원 목록으로
        </Button>

        {/* 회원 정보 및 작업 버튼 */}
        <div className="grid gap-6 md:grid-cols-2">
          <UserDetailCard user={user} />
          <UserActionButtons
            user={user}
            onApprove={handleApprove}
            onBlock={handleBlock}
            onRoleChange={handleRoleChange}
          />
        </div>

        {/* 업로드한 콘텐츠 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>업로드한 콘텐츠 ({userContents.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {userContents.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">업로드한 콘텐츠가 없습니다.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>파일명</TableHead>
                    <TableHead>컬렉션</TableHead>
                    <TableHead>분석 상태</TableHead>
                    <TableHead>발견 건수</TableHead>
                    <TableHead>업로드일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userContents.map((content) => (
                    <TableRow
                      key={content.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/admin/contents/${content.id}`)}
                    >
                      <TableCell className="font-medium">{content.file_name}</TableCell>
                      <TableCell>{content.collection_name || '-'}</TableCell>
                      <TableCell>{getAnalysisStatusBadge(content.is_analyzed)}</TableCell>
                      <TableCell>
                        {content.detected_count ? (
                          <span className="font-semibold text-red-600">
                            {content.detected_count}건
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {format(new Date(content.created_at), 'PPP', { locale: ko })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
