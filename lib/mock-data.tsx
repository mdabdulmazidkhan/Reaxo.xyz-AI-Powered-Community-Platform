export interface User {
  id: string
  username: string
  displayName: string
  avatar: string
  role: "admin" | "moderator" | "member"
  joinedAt: string
  postCount: number
  reputation: number
}

export interface Tag {
  id: string
  name: string
  color: string
  threadCount: number
}

export interface Thread {
  id: string
  title: string
  slug: string
  content: string
  author: User
  tags: Tag[]
  createdAt: string
  updatedAt: string
  viewCount: number
  replyCount: number
  likeCount: number
  isPinned: boolean
  isLocked: boolean
  lastReply?: {
    author: User
    createdAt: string
  }
}

export interface Post {
  id: string
  content: string
  author: User
  createdAt: string
  updatedAt: string
  likeCount: number
  isEdited: boolean
  replyTo?: string
}

export const mockUsers: User[] = [
  {
    id: "1",
    username: "sarah_dev",
    displayName: "Sarah Chen",
    avatar: "/woman-developer-avatar.png",
    role: "admin",
    joinedAt: "2023-01-15",
    postCount: 342,
    reputation: 4820,
  },
  {
    id: "2",
    username: "alex_code",
    displayName: "Alex Rivera",
    avatar: "/man-developer-avatar.png",
    role: "moderator",
    joinedAt: "2023-03-22",
    postCount: 198,
    reputation: 2340,
  },
  {
    id: "3",
    username: "maya_ui",
    displayName: "Maya Patel",
    avatar: "/designer-woman-avatar.jpg",
    role: "member",
    joinedAt: "2023-06-10",
    postCount: 87,
    reputation: 920,
  },
  {
    id: "4",
    username: "james_rust",
    displayName: "James Wilson",
    avatar: "/programmer-man-avatar.jpg",
    role: "member",
    joinedAt: "2023-08-05",
    postCount: 156,
    reputation: 1560,
  },
  {
    id: "5",
    username: "nina_data",
    displayName: "Nina Kowalski",
    avatar: "/data-scientist-woman-avatar.jpg",
    role: "member",
    joinedAt: "2023-09-12",
    postCount: 64,
    reputation: 780,
  },
]

export const mockTags: Tag[] = [
  { id: "1", name: "Next.js", color: "bg-primary", threadCount: 234 },
  { id: "2", name: "React", color: "bg-blue-500", threadCount: 456 },
  { id: "3", name: "TypeScript", color: "bg-blue-600", threadCount: 321 },
  { id: "4", name: "Tailwind", color: "bg-cyan-500", threadCount: 189 },
  { id: "5", name: "API Design", color: "bg-orange-500", threadCount: 98 },
  { id: "6", name: "Performance", color: "bg-red-500", threadCount: 76 },
  { id: "7", name: "DevOps", color: "bg-purple-500", threadCount: 145 },
  { id: "8", name: "Career", color: "bg-pink-500", threadCount: 267 },
]

export const mockThreads: Thread[] = [
  {
    id: "1",
    title: "Best practices for Server Components in Next.js 15?",
    slug: "best-practices-server-components-nextjs-15",
    content: `I've been diving deep into Next.js 15 and the new React Server Components architecture. What are some patterns you've found effective for managing data fetching and state?

Specifically interested in:
- When to use \`use client\` vs keeping things server-side
- Handling authentication in RSC
- Streaming and Suspense patterns

Would love to hear your experiences!`,
    author: mockUsers[0],
    tags: [mockTags[0], mockTags[1], mockTags[2]],
    createdAt: "2024-12-28T10:30:00Z",
    updatedAt: "2024-12-28T15:45:00Z",
    viewCount: 1234,
    replyCount: 23,
    likeCount: 89,
    isPinned: true,
    isLocked: false,
    lastReply: {
      author: mockUsers[1],
      createdAt: "2024-12-29T08:20:00Z",
    },
  },
  {
    id: "2",
    title: "How I reduced our bundle size by 60% with tree shaking",
    slug: "reduced-bundle-size-60-percent-tree-shaking",
    content: `After months of our app growing slower and slower, I finally sat down to analyze our bundle. Here's what I found and how we fixed it...

The main culprits were:
1. Importing entire lodash instead of individual functions
2. Not properly code-splitting routes
3. Including dev dependencies in production

Full write-up with before/after metrics inside!`,
    author: mockUsers[3],
    tags: [mockTags[5], mockTags[0]],
    createdAt: "2024-12-27T14:20:00Z",
    updatedAt: "2024-12-27T14:20:00Z",
    viewCount: 2456,
    replyCount: 45,
    likeCount: 234,
    isPinned: false,
    isLocked: false,
    lastReply: {
      author: mockUsers[2],
      createdAt: "2024-12-29T06:15:00Z",
    },
  },
  {
    id: "3",
    title: "Transitioning from Frontend to Full-Stack: My 6 Month Journey",
    slug: "frontend-to-fullstack-6-month-journey",
    content: `Six months ago I was purely a frontend developer. Today I'm comfortable building entire applications end-to-end. Here's how I made the transition...

Key resources that helped:
- Building side projects with real databases
- Learning SQL fundamentals
- Understanding API design patterns
- Getting comfortable with the terminal`,
    author: mockUsers[2],
    tags: [mockTags[7]],
    createdAt: "2024-12-26T09:00:00Z",
    updatedAt: "2024-12-26T09:00:00Z",
    viewCount: 3890,
    replyCount: 67,
    likeCount: 312,
    isPinned: false,
    isLocked: false,
    lastReply: {
      author: mockUsers[4],
      createdAt: "2024-12-29T02:30:00Z",
    },
  },
  {
    id: "4",
    title: "Building a real-time collaborative editor with Yjs and React",
    slug: "realtime-collaborative-editor-yjs-react",
    content: `Just shipped a Google Docs-like collaborative editor using Yjs for CRDT-based sync. The experience was... interesting.

Topics covered:
- Setting up Yjs with React
- WebSocket provider configuration
- Handling offline mode
- Cursor presence and awareness

Code repo linked in comments!`,
    author: mockUsers[1],
    tags: [mockTags[1], mockTags[2]],
    createdAt: "2024-12-25T16:45:00Z",
    updatedAt: "2024-12-25T18:30:00Z",
    viewCount: 1567,
    replyCount: 34,
    likeCount: 156,
    isPinned: false,
    isLocked: false,
    lastReply: {
      author: mockUsers[0],
      createdAt: "2024-12-28T22:10:00Z",
    },
  },
  {
    id: "5",
    title: "Why we switched from REST to tRPC (and you might want to too)",
    slug: "switched-rest-to-trpc",
    content: `Our team just completed migrating our entire API from REST to tRPC. Here's our honest assessment after 3 months in production...

Pros:
- End-to-end type safety is incredible
- No more API documentation to maintain
- Faster development velocity

Cons:
- Learning curve for the team
- Less suitable for public APIs`,
    author: mockUsers[4],
    tags: [mockTags[4], mockTags[2]],
    createdAt: "2024-12-24T11:20:00Z",
    updatedAt: "2024-12-24T11:20:00Z",
    viewCount: 2890,
    replyCount: 56,
    likeCount: 198,
    isPinned: false,
    isLocked: false,
    lastReply: {
      author: mockUsers[3],
      createdAt: "2024-12-28T19:45:00Z",
    },
  },
  {
    id: "6",
    title: "Docker Compose patterns for local development",
    slug: "docker-compose-patterns-local-development",
    content: `After years of \"it works on my machine\" issues, I've developed a solid Docker Compose setup that works for our entire team...

What's included:
- Hot reloading that actually works
- Database seeding on startup
- Service dependency management
- Volume mounting best practices`,
    author: mockUsers[3],
    tags: [mockTags[6]],
    createdAt: "2024-12-23T08:30:00Z",
    updatedAt: "2024-12-23T08:30:00Z",
    viewCount: 1234,
    replyCount: 28,
    likeCount: 87,
    isPinned: false,
    isLocked: false,
    lastReply: {
      author: mockUsers[1],
      createdAt: "2024-12-27T14:20:00Z",
    },
  },
]

export const mockPosts: Post[] = [
  {
    id: "p1",
    content: `Great question! I've been working with RSC extensively and here are my thoughts:

**When to use \`use client\`:**
- Interactive components (forms, modals, dropdowns)
- Components using browser APIs
- State that changes frequently

**Authentication in RSC:**
We use cookies for auth tokens and validate them in a middleware. The session is then passed down through React context.

**Streaming patterns:**
Wrap slow data fetches in Suspense boundaries. This lets the fast parts render immediately.

\`\`\`tsx
<Suspense fallback={<Skeleton />}>
  <SlowDataComponent />
</Suspense>
\`\`\`

Happy to share more specific examples!`,
    author: mockUsers[1],
    createdAt: "2024-12-28T11:45:00Z",
    updatedAt: "2024-12-28T11:45:00Z",
    likeCount: 34,
    isEdited: false,
  },
  {
    id: "p2",
    content: `Adding to what Alex said - one pattern I've found really useful is creating a \`getServerSession\` helper that you can call in any server component:

\`\`\`tsx
// lib/auth.ts
export async function getServerSession() {
  const cookieStore = cookies()
  const token = cookieStore.get('session')
  if (!token) return null
  return validateToken(token.value)
}
\`\`\`

Then in your components:

\`\`\`tsx
// app/dashboard/page.tsx
export default async function Dashboard() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  // ... rest of component
}
\`\`\`

This keeps auth logic centralized and testable.`,
    author: mockUsers[0],
    createdAt: "2024-12-28T13:20:00Z",
    updatedAt: "2024-12-28T14:15:00Z",
    likeCount: 28,
    isEdited: true,
    replyTo: "p1",
  },
  {
    id: "p3",
    content: `This is exactly what I needed! One follow-up question - how do you handle cases where you need real-time updates in a Server Component?

For example, we have a dashboard that shows live metrics. Currently using polling but it feels wrong.`,
    author: mockUsers[2],
    createdAt: "2024-12-28T15:00:00Z",
    updatedAt: "2024-12-28T15:00:00Z",
    likeCount: 12,
    isEdited: false,
    replyTo: "p2",
  },
  {
    id: "p4",
    content: `@maya_ui For real-time data, you have a few options:

1. **Keep it client-side**: Use \`use client\` with WebSockets/SSE for truly real-time components
2. **Server-Sent Events**: Stream updates from a Route Handler
3. **Next.js revalidation**: For near-real-time, use \`revalidatePath\` or \`revalidateTag\`

For live metrics specifically, I'd probably go with option 1 or 2. Here's a quick SSE example:

\`\`\`tsx
// app/api/metrics/route.ts
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        const data = JSON.stringify(getLatestMetrics())
        controller.enqueue(\`data: \${data}\\n\\n\`)
      }, 1000)
      // cleanup...
    }
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
\`\`\``,
    author: mockUsers[1],
    createdAt: "2024-12-28T16:30:00Z",
    updatedAt: "2024-12-28T16:30:00Z",
    likeCount: 45,
    isEdited: false,
    replyTo: "p3",
  },
  {
    id: "p5",
    content: `Amazing thread! Bookmarking this for future reference. 

One thing I'd add - be careful with over-using Suspense boundaries. We had a page with 10+ suspense boundaries and it caused a \"popcorn\" effect where content kept jumping around as things loaded.

Found that grouping related data fetches under fewer boundaries gave a much smoother UX.`,
    author: mockUsers[4],
    createdAt: "2024-12-29T08:20:00Z",
    updatedAt: "2024-12-29T08:20:00Z",
    likeCount: 19,
    isEdited: false,
  },
]

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}
