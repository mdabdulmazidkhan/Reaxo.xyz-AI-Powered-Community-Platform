import { Header } from "@/components/header"
import { ForumDiscovery } from "@/components/forum-discovery"

export default function ForumsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Forums</h1>
          <p className="text-muted-foreground">Find communities that match your interests and join the conversation</p>
        </div>
        <ForumDiscovery />
      </div>
    </div>
  )
}
