// Persistent forum store using Vercel Blob for storage
import { put, list, del } from "@vercel/blob"
import type { Forum, ForumMember, PendingPost } from "./types"

const FORUMS_BLOB_NAME = "reaxo-forums.json"
const MEMBERS_BLOB_NAME = "reaxo-members.json"
const PENDING_BLOB_NAME = "reaxo-pending.json"

function findBlobByName(blobs: { pathname: string; url: string }[], targetName: string) {
  let blob = blobs.find((b) => b.pathname === targetName)
  if (blob) return blob

  blob = blobs.find((b) => b.pathname.endsWith(targetName))
  if (blob) return blob

  blob = blobs.find((b) => b.pathname.includes(targetName.replace(".json", "")))
  if (blob) return blob

  return null
}

async function loadFromBlob<T>(blobName: string, defaultValue: T[]): Promise<T[]> {
  try {
    const { blobs } = await list()
    const blob = findBlobByName(blobs, blobName)

    if (!blob) {
      return defaultValue
    }

    const response = await fetch(blob.url, { cache: "no-store" })
    if (!response.ok) {
      return defaultValue
    }

    const data = await response.json()
    return data as T[]
  } catch (error) {
    console.error(`Error loading from blob ${blobName}:`, error)
    return defaultValue
  }
}

async function saveToBlob<T>(blobName: string, data: T[]): Promise<void> {
  try {
    const { blobs } = await list()
    for (const blob of blobs) {
      if (blob.pathname.includes(blobName.replace(".json", ""))) {
        await del(blob.url)
      }
    }

    const jsonString = JSON.stringify(data)
    await put(blobName, jsonString, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    })
  } catch (error) {
    console.error(`Error saving to blob ${blobName}:`, error)
    throw error
  }
}

// Public API functions - always load fresh from blob
export async function getForums(): Promise<Forum[]> {
  return await loadFromBlob<Forum>(FORUMS_BLOB_NAME, [])
}

export async function getPublicForums(): Promise<Forum[]> {
  const forums = await getForums()
  return forums.filter((f) => f.isPublic)
}

export async function getForumsByOwner(ownerId: string): Promise<Forum[]> {
  const forums = await getForums()
  return forums.filter((f) => f.ownerId === ownerId)
}

export async function getForumBySlug(slug: string): Promise<Forum | undefined> {
  const forums = await getForums()
  return forums.find((f) => f.slug === slug)
}

export async function getForumById(id: string): Promise<Forum | undefined> {
  const forums = await getForums()
  return forums.find((f) => f.id === id)
}

export async function createForum(
  forum: Omit<Forum, "id" | "createdAt" | "memberCount" | "threadCount">,
): Promise<Forum> {
  const forums = await getForums()
  const members = await loadFromBlob<ForumMember>(MEMBERS_BLOB_NAME, [])

  const newForum: Forum = {
    ...forum,
    id: `forum-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    memberCount: 1,
    threadCount: 0,
    createdAt: new Date().toISOString(),
    settings: forum.settings || {
      requirePostApproval: false,
      requireMemberApproval: false,
      allowGuests: true,
      allowImages: true,
      allowVideos: true,
      allowLinks: true,
      minPostLength: 10,
      maxPostLength: 50000,
    },
  }

  forums.push(newForum)
  await saveToBlob(FORUMS_BLOB_NAME, forums)

  const ownerMember: ForumMember = {
    id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    forumId: newForum.id,
    userId: forum.ownerId,
    role: "owner",
    joinedAt: new Date().toISOString(),
  }
  members.push(ownerMember)
  await saveToBlob(MEMBERS_BLOB_NAME, members)

  return newForum
}

export async function updateForum(id: string, updates: Partial<Forum>): Promise<Forum | undefined> {
  const forums = await getForums()
  const index = forums.findIndex((f) => f.id === id)
  if (index === -1) return undefined

  forums[index] = { ...forums[index], ...updates, updatedAt: new Date().toISOString() }
  await saveToBlob(FORUMS_BLOB_NAME, forums)

  return forums[index]
}

export async function deleteForum(id: string): Promise<boolean> {
  const forums = await getForums()
  const index = forums.findIndex((f) => f.id === id)
  if (index === -1) return false

  forums.splice(index, 1)
  await saveToBlob(FORUMS_BLOB_NAME, forums)

  const members = await loadFromBlob<ForumMember>(MEMBERS_BLOB_NAME, [])
  const updatedMembers = members.filter((m) => m.forumId !== id)
  await saveToBlob(MEMBERS_BLOB_NAME, updatedMembers)

  return true
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const reserved = [
    "www",
    "api",
    "admin",
    "dashboard",
    "app",
    "mail",
    "ftp",
    "localhost",
    "forums",
    "profile",
    "settings",
    "home",
    "feed",
  ]
  if (reserved.includes(slug.toLowerCase())) return false

  const forums = await getForums()
  return !forums.some((f) => f.slug.toLowerCase() === slug.toLowerCase())
}

export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  return isSlugAvailable(subdomain)
}

export async function joinForum(userId: string, forumId: string): Promise<ForumMember | null> {
  const forum = await getForumById(forumId)
  if (!forum) return null

  const members = await loadFromBlob<ForumMember>(MEMBERS_BLOB_NAME, [])

  const existing = members.find((m) => m.userId === userId && m.forumId === forumId)
  if (existing) return existing

  const member: ForumMember = {
    id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    forumId,
    userId,
    role: "member",
    joinedAt: new Date().toISOString(),
  }
  members.push(member)
  await saveToBlob(MEMBERS_BLOB_NAME, members)

  const forums = await getForums()
  const forumIndex = forums.findIndex((f) => f.id === forumId)
  if (forumIndex !== -1) {
    forums[forumIndex].memberCount = (forums[forumIndex].memberCount || 0) + 1
    await saveToBlob(FORUMS_BLOB_NAME, forums)
  }

  return member
}

export async function leaveForum(userId: string, forumId: string): Promise<boolean> {
  const members = await loadFromBlob<ForumMember>(MEMBERS_BLOB_NAME, [])
  const index = members.findIndex((m) => m.userId === userId && m.forumId === forumId)
  if (index === -1) return false

  if (members[index].role === "owner") return false

  members.splice(index, 1)
  await saveToBlob(MEMBERS_BLOB_NAME, members)

  const forums = await getForums()
  const forumIndex = forums.findIndex((f) => f.id === forumId)
  if (forumIndex !== -1 && forums[forumIndex].memberCount) {
    forums[forumIndex].memberCount = Math.max(0, forums[forumIndex].memberCount - 1)
    await saveToBlob(FORUMS_BLOB_NAME, forums)
  }

  return true
}

export async function getUserMemberships(userId: string): Promise<ForumMember[]> {
  const members = await loadFromBlob<ForumMember>(MEMBERS_BLOB_NAME, [])
  return members.filter((m) => m.userId === userId)
}

export async function getJoinedForums(userId: string): Promise<Forum[]> {
  const memberships = await getUserMemberships(userId)
  const forums = await getForums()

  const joinedForums = memberships
    .map((m) => forums.find((f) => f.id === m.forumId))
    .filter((f): f is Forum => f !== undefined)

  return joinedForums
}

export async function isMember(userId: string, forumId: string): Promise<boolean> {
  const members = await loadFromBlob<ForumMember>(MEMBERS_BLOB_NAME, [])
  return members.some((m) => m.userId === userId && m.forumId === forumId)
}

export async function getMemberRole(userId: string, forumId: string): Promise<ForumMember["role"] | null> {
  const members = await loadFromBlob<ForumMember>(MEMBERS_BLOB_NAME, [])
  const member = members.find((m) => m.userId === userId && m.forumId === forumId)
  return member?.role || null
}

export async function addPendingPost(post: Omit<PendingPost, "id" | "createdAt" | "status">): Promise<PendingPost> {
  const pending = await loadFromBlob<PendingPost>(PENDING_BLOB_NAME, [])

  const newPost: PendingPost = {
    ...post,
    id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  }
  pending.push(newPost)
  await saveToBlob(PENDING_BLOB_NAME, pending)

  return newPost
}

export async function getPendingPosts(forumId: string): Promise<PendingPost[]> {
  const pending = await loadFromBlob<PendingPost>(PENDING_BLOB_NAME, [])
  return pending.filter((p) => p.forumId === forumId && p.status === "pending")
}

export async function approvePendingPost(postId: string, reviewerId: string): Promise<PendingPost | null> {
  const pending = await loadFromBlob<PendingPost>(PENDING_BLOB_NAME, [])
  const index = pending.findIndex((p) => p.id === postId)
  if (index === -1) return null

  pending[index].status = "approved"
  pending[index].reviewedAt = new Date().toISOString()
  pending[index].reviewedBy = reviewerId
  await saveToBlob(PENDING_BLOB_NAME, pending)

  return pending[index]
}

export async function rejectPendingPost(postId: string, reviewerId: string): Promise<PendingPost | null> {
  const pending = await loadFromBlob<PendingPost>(PENDING_BLOB_NAME, [])
  const index = pending.findIndex((p) => p.id === postId)
  if (index === -1) return null

  pending[index].status = "rejected"
  pending[index].reviewedAt = new Date().toISOString()
  pending[index].reviewedBy = reviewerId
  await saveToBlob(PENDING_BLOB_NAME, pending)

  return pending[index]
}

export async function getForumMembers(forumId: string): Promise<ForumMember[]> {
  const members = await loadFromBlob<ForumMember>(MEMBERS_BLOB_NAME, [])
  return members.filter((m) => m.forumId === forumId)
}

export async function updateMemberRole(
  forumId: string,
  userId: string,
  role: ForumMember["role"],
): Promise<ForumMember | null> {
  const members = await loadFromBlob<ForumMember>(MEMBERS_BLOB_NAME, [])
  const index = members.findIndex((m) => m.forumId === forumId && m.userId === userId)
  if (index === -1) return null

  members[index].role = role
  await saveToBlob(MEMBERS_BLOB_NAME, members)

  return members[index]
}

export async function removeMember(forumId: string, userId: string): Promise<boolean> {
  const members = await loadFromBlob<ForumMember>(MEMBERS_BLOB_NAME, [])
  const index = members.findIndex((m) => m.forumId === forumId && m.userId === userId)
  if (index === -1) return false
  if (members[index].role === "owner") return false

  members.splice(index, 1)
  await saveToBlob(MEMBERS_BLOB_NAME, members)

  const forums = await getForums()
  const forumIndex = forums.findIndex((f) => f.id === forumId)
  if (forumIndex !== -1 && forums[forumIndex].memberCount) {
    forums[forumIndex].memberCount = Math.max(0, forums[forumIndex].memberCount - 1)
    await saveToBlob(FORUMS_BLOB_NAME, forums)
  }

  return true
}

export async function refreshCache(): Promise<void> {
  // No-op now since we always load fresh
}

export const forumStore = {
  getForums,
  listPublicForums: getPublicForums,
  getForumsByOwner,
  getForumBySlug,
  getForumById,
  createForum,
  updateForum,
  deleteForum,
  isSlugAvailable,
  isSubdomainAvailable,
  joinForum,
  leaveForum,
  getUserMemberships,
  getJoinedForums,
  isMember,
  getMemberRole,
  addPendingPost,
  getPendingPosts,
  approvePendingPost,
  rejectPendingPost,
  getForumMembers,
  updateMemberRole,
  removeMember,
  refreshCache,
}
