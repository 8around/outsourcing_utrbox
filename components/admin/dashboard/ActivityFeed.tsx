import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { FileImage, UserPlus } from 'lucide-react'

interface PendingContentItem {
  id: string
  file_name: string
  user_name: string
  created_at: string
}

interface PendingUserItem {
  id: string
  name: string
  email: string
  created_at: string
}

interface ActivityFeedProps {
  pendingContents: PendingContentItem[]
  pendingUsers: PendingUserItem[]
  maxItems?: number // 각 섹션별 최대 표시 개수 (기본값: 10)
}

export function ActivityFeed({ pendingContents, pendingUsers, maxItems = 10 }: ActivityFeedProps) {
  const displayedContents = pendingContents.slice(0, maxItems)
  const displayedUsers = pendingUsers.slice(0, maxItems)

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko,
      })
    } catch {
      return '알 수 없음'
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 최근 대기중인 콘텐츠 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileImage className="h-5 w-5 text-blue-600" />
            최근 대기중인 콘텐츠
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayedContents.length === 0 ? (
            <p className="text-sm text-gray-500">대기중인 콘텐츠가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {displayedContents.map((content) => (
                <div
                  key={content.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{content.file_name}</p>
                    <p className="text-xs text-gray-500">업로더: {content.user_name}</p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      대기중
                    </Badge>
                    <span className="text-xs text-gray-400">{getTimeAgo(content.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 가입 요청 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-green-600" />
            최근 가입 요청
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayedUsers.length === 0 ? (
            <p className="text-sm text-gray-500">가입 요청이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {displayedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                      승인 대기
                    </Badge>
                    <span className="text-xs text-gray-400">{getTimeAgo(user.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
