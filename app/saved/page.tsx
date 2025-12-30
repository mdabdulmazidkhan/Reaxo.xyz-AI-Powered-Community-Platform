import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { SavedThreadList } from "@/components/saved-thread-list"

export default function SavedPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          <Sidebar />

          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Saved Posts</h1>
              <p className="text-muted-foreground">Posts you've bookmarked for later</p>
            </div>
            <SavedThreadList />
          </main>

          <aside className="hidden w-72 shrink-0 xl:block">
            <div className="sticky top-20">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-2">About Saved Posts</h3>
                <p className="text-sm text-muted-foreground">
                  Your saved posts are stored locally and synced to your account. Click the bookmark icon on any post to
                  save it here.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
