import { getForumBySlug } from "@/lib/forum-store"
import { ForumHomepage } from "@/components/forum/forum-homepage"
import { ForumNotFound } from "@/components/forum/forum-not-found"

interface ForumPageProps {
  params: Promise<{ slug: string }>
}

export default async function ForumPage({ params }: ForumPageProps) {
  const { slug } = await params

  const forum = await getForumBySlug(slug)

  if (!forum) {
    return <ForumNotFound slug={slug} />
  }

  return <ForumHomepage forum={forum} />
}
