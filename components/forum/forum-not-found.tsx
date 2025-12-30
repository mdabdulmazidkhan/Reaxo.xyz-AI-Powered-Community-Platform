import { MessageSquare, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ForumNotFoundProps {
  slug: string
}

export function ForumNotFound({ slug }: ForumNotFoundProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Reaxo</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="text-center max-w-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto mb-6">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Forum Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The forum <span className="font-mono text-foreground">f/{slug}</span> doesn't exist or may have been
            removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                <Plus className="mr-2 h-4 w-4" />
                Create a Forum
              </Link>
            </Button>
          </div>
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-3">Try one of our demo forums:</p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="secondary" size="sm">
                <Link href="/f/tech">Tech Enthusiasts</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/f/gaming">Gaming Hub</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
