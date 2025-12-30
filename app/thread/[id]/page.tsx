import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ThreadDetail } from "@/components/thread-detail"
import { TrendingUsers } from "@/components/trending-users"

interface ThreadPageProps {
  params: Promise<{ id: string }>
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const resolvedParams = await params
  const threadId = resolvedParams.id

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <ThreadDetail threadId={threadId} />
          </main>

          {/* Right Sidebar */}
          <aside className="hidden w-72 shrink-0 xl:block">
            <div className="sticky top-20 space-y-4">
              <TrendingUsers />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
