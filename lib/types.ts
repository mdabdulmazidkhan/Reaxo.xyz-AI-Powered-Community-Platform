// Type definitions matching the Foru.ms API
export interface User {
  id: string
  username: string
  email?: string
  displayName: string
  avatar?: string
  bio?: string
  roles?: Role[]
  postCount?: number
  threadCount?: number
  reputation?: number
  createdAt: string
  updatedAt?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  color?: string
}

export interface Tag {
  id: string
  name: string
  description?: string
  color?: string
  threadCount?: number
  subscriberCount?: number
}

export interface Thread {
  id: string
  title: string
  body: string
  author: User
  tags?: Tag[]
  postCount?: number
  viewCount?: number
  likeCount?: number
  isPinned?: boolean
  isLocked?: boolean
  createdAt: string
  updatedAt?: string
  lastPost?: Post
}

export interface Post {
  id: string
  body: string
  author: User
  threadId: string
  parentId?: string
  likeCount?: number
  children?: Post[]
  createdAt: string
  updatedAt?: string
}

export interface Stats {
  userCount: number
  threadCount: number
  postCount: number
  tagCount: number
  onlineCount?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  cursor?: string | null
  hasMore?: boolean
}

export interface Forum {
  id: string
  name: string
  slug: string // renamed from subdomain to slug for path-based URLs
  description?: string
  icon?: string
  banner?: string
  settings?: ForumSettings
  ownerId: string
  memberCount?: number
  threadCount?: number
  isPublic: boolean
  createdAt: string
  updatedAt?: string
}

export interface ForumSettings {
  // Moderation settings
  requirePostApproval?: boolean
  requireMemberApproval?: boolean
  allowGuests?: boolean
  // Content settings
  allowImages?: boolean
  allowVideos?: boolean
  allowLinks?: boolean
  // Posting rules
  minPostLength?: number
  maxPostLength?: number
  // Theme
  primaryColor?: string
  accentColor?: string
}

export interface PendingPost {
  id: string
  forumId: string
  threadId?: string
  type: "thread" | "reply"
  title?: string
  body: string
  authorId: string
  authorName: string
  authorAvatar?: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface ForumMember {
  id: string
  forumId: string
  userId: string
  role: "owner" | "admin" | "moderator" | "member"
  joinedAt: string
}

export interface ThreadWithForum extends Thread {
  forum?: Forum
  forumId?: string
}
