import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { TrendingUsers } from "@/components/trending-users"
import { FilteredThreadList } from "@/components/filtered-thread-list"

export default function RecentPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          <Sidebar />

          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Recent</h1>
              <p className="text-muted-foreground">Latest posts from the community</p>
            </div>
            <FilteredThreadList filter="newest" />
          </main>

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
