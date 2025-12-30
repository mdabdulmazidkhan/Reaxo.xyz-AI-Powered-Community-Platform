import type { Metadata } from "next"
import { UserProfileContent } from "@/components/user-profile-content"

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${username} - Reaxo`,
    description: `View ${username}'s profile and posts on Reaxo`,
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  return <UserProfileContent username={username} />
}
