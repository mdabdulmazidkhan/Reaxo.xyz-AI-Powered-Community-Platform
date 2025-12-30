import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { ThreadList } from "@/components/thread-list"
import { TrendingUsers } from "@/components/trending-users"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <ThreadList />
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
