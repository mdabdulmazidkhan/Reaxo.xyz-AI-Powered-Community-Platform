"use client"

import { ForumHeader } from "./forum-header"
import { ForumSidebar } from "./forum-sidebar"
import { ForumThreadList } from "./forum-thread-list"
import type { Forum } from "@/lib/types"

interface ForumHomepageProps {
  forum: Forum
}

export function ForumHomepage({ forum }: ForumHomepageProps) {
  return (
    <div className="min-h-screen bg-background">
      <ForumHeader forum={forum} />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          <ForumSidebar forum={forum} />

          <main className="flex-1 min-w-0">
            <ForumThreadList forum={forum} />
          </main>
        </div>
      </div>
    </div>
  )
}
