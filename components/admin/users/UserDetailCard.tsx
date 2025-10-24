import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User } from '@/lib/admin/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { User as UserIcon, Mail, Building2, Calendar, Clock } from 'lucide-react'

interface UserDetailCardProps {
  user: User
}

export function UserDetailCard({ user }: UserDetailCardProps) {
  const getStatusBadge = (isApproved: boolean | null) => {
    if (isApproved === true) {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">승인됨</Badge>
    } else if (isApproved === null) {
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">승인 대기</Badge>
    } else {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
          거부됨
        </Badge>
      )
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="default">관리자</Badge>
    }
    return <Badge variant="outline">일반 회원</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>회원 정보</span>
          <div className="flex gap-2">
            {getStatusBadge(user.is_approved)}
            {getRoleBadge(user.role)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <UserIcon className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">이름</p>
              <p className="text-base font-semibold text-gray-900">{user.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">이메일</p>
              <p className="text-base text-gray-900">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">소속</p>
              <p className="text-base text-gray-900">{user.organization || '-'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">가입일</p>
              <p className="text-base text-gray-900">
                {format(new Date(user.created_at), 'PPP', { locale: ko })}
              </p>
            </div>
          </div>

          {user.last_login && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">마지막 로그인</p>
                <p className="text-base text-gray-900">
                  {format(new Date(user.last_login), 'PPP p', { locale: ko })}
                </p>
              </div>
            </div>
          )}

          {user.contents_count !== undefined && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-500">업로드한 콘텐츠</p>
              <p className="text-2xl font-bold text-gray-900">{user.contents_count}개</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
