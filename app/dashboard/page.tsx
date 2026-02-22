import { requireAuth } from '@/lib/auth'
import { getCachedWorkspaces } from '@/lib/queries/workspaces'
import { getCachedArticles } from '@/lib/queries/articles'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const user = await requireAuth()
  const workspaces = await getCachedWorkspaces(user.id)
  const articles = await getCachedArticles(user.id)

  return (
    <DashboardContent
      userId={user.id}
      initialWorkspaces={workspaces}
      initialArticles={articles}
      user={user}
    />
  )
}
