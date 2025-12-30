import { getForumBySlug } from "@/lib/forum-store"
import { ForumThreadDetail } from "@/components/forum/forum-thread-detail"
import { ForumNotFound } from "@/components/forum/forum-not-found"

interface ForumThreadPageProps {
  params: Promise<{ slug: string; threadId: string }>
}

export default async function ForumThreadPage({ params }: ForumThreadPageProps) {
  const { slug, threadId } = await params

  // First check demo forums, then the store
  const forum = await getForumBySlug(slug)

  if (!forum) {
    return <ForumNotFound slug={slug} />
  }

  return <ForumThreadDetail forum={forum} threadId={threadId} />
}
