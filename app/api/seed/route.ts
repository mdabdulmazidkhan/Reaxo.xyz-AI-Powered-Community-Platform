"use client"

import { NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

// Seed data for the hackathon demo
const seedTags = [
  { name: "Next.js", description: "Discussions about Next.js framework", color: "#000000" },
  { name: "React", description: "React library discussions", color: "#61DAFB" },
  { name: "TypeScript", description: "TypeScript language topics", color: "#3178C6" },
  { name: "Performance", description: "Performance optimization", color: "#FF6B6B" },
  { name: "Career", description: "Career advice and discussions", color: "#4ECDC4" },
  { name: "Databases", description: "Database related topics", color: "#336791" },
  { name: "DevOps", description: "DevOps and deployment", color: "#FF9900" },
  { name: "AI", description: "Artificial Intelligence", color: "#9B59B6" },
]

const seedUsers = [
  {
    username: "alexchen",
    email: "alexchen@reaxo-demo.com",
    password: "Demo123!@#",
    displayName: "Alex Chen",
  },
  {
    username: "sarahdev",
    email: "sarahdev@reaxo-demo.com",
    password: "Demo123!@#",
    displayName: "Sarah Dev",
  },
  {
    username: "mikecode",
    email: "mikecode@reaxo-demo.com",
    password: "Demo123!@#",
    displayName: "Mike Code",
  },
  {
    username: "emilywrites",
    email: "emilywrites@reaxo-demo.com",
    password: "Demo123!@#",
    displayName: "Emily Writes",
  },
  {
    username: "jamesbuilds",
    email: "jamesbuilds@reaxo-demo.com",
    password: "Demo123!@#",
    displayName: "James Builds",
  },
]

const seedThreads = [
  {
    title: "Best practices for Server Components in Next.js 15",
    body: `I've been migrating our app to Next.js 15 and wanted to share some patterns I've discovered for Server Components.

## Key Learnings

1. **Data fetching at the component level** - Instead of fetching all data in the page, fetch data where it's needed
2. **Streaming with Suspense** - Wrap slow components in Suspense for better UX
3. **Server Actions for mutations** - Use Server Actions instead of API routes for form submissions

\`\`\`tsx
// Example: Data fetching in Server Component
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId) // Direct database call!
  return <div>{user.name}</div>
}
\`\`\`

What patterns have you found useful?`,
    tags: ["Next.js", "React"],
  },
  {
    title: "How I reduced our bundle size by 60%",
    body: `After weeks of optimization work, I managed to reduce our production bundle from 450KB to 180KB. Here's how:

## The Big Wins

### 1. Dynamic Imports
Lazy load heavy components:
\`\`\`tsx
const HeavyChart = dynamic(() => import('./Chart'), { 
  loading: () => <Skeleton /> 
})
\`\`\`

### 2. Tree Shaking
Only import what you need:
\`\`\`tsx
// Bad
import _ from 'lodash'

// Good  
import debounce from 'lodash/debounce'
\`\`\`

### 3. Analyze Your Bundle
Use \`@next/bundle-analyzer\` to find the culprits!

What other optimization tips do you have?`,
    tags: ["Performance", "Next.js"],
  },
  {
    title: "Career advice: Transitioning from backend to full-stack",
    body: `I've been a backend engineer (Python/Django) for 5 years and I'm looking to transition to full-stack with React/Next.js.

## My Plan
1. Complete the React documentation
2. Build 3 side projects
3. Contribute to open source
4. Apply to full-stack roles

## Questions
- Is this a reasonable timeline for 6 months?
- What skills should I prioritize?
- Any recommended resources?

Would love to hear from others who made this transition!`,
    tags: ["Career", "React"],
  },
  {
    title: "PostgreSQL vs MySQL for new projects in 2025",
    body: `Starting a new SaaS project and trying to decide between PostgreSQL and MySQL. 

## What I Need
- JSON support for flexible schemas
- Full-text search
- Good ORM support (Prisma/Drizzle)
- Scalability for millions of rows

## Current Thinking
Leaning towards PostgreSQL because:
- Better JSON support with JSONB
- More advanced features (CTEs, window functions)
- Great ecosystem with Supabase, Neon, etc.

But MySQL has:
- Simpler setup
- Better documentation
- Wider hosting support

What would you choose and why?`,
    tags: ["Databases"],
  },
  {
    title: "Implementing real-time features with Server-Sent Events",
    body: `Just implemented SSE for our notification system and it's been great. Here's a quick guide:

## Server Side (Next.js Route Handler)
\`\`\`ts
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        controller.enqueue(\`data: \${JSON.stringify({ time: Date.now() })}\\n\\n\`)
      }, 1000)
      
      return () => clearInterval(interval)
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  })
}
\`\`\`

## Client Side
\`\`\`tsx
useEffect(() => {
  const eventSource = new EventSource('/api/events')
  eventSource.onmessage = (e) => console.log(JSON.parse(e.data))
  return () => eventSource.close()
}, [])
\`\`\`

Much simpler than WebSockets for one-way communication!`,
    tags: ["Next.js", "TypeScript"],
  },
]

export async function POST() {
  try {
    const results = {
      tags: [] as any[],
      users: [] as any[],
      threads: [] as any[],
      errors: [] as string[],
    }

    // Create tags first
    console.log("[v0] Creating tags...")
    for (const tag of seedTags) {
      try {
        const created = await forumClient.tags.create(tag)
        results.tags.push(created)
        console.log(`[v0] Created tag: ${tag.name}`)
      } catch (e: any) {
        console.log(`[v0] Tag ${tag.name} error:`, e.message)
        results.errors.push(`Tag ${tag.name}: ${e.message}`)
      }
    }

    console.log("[v0] Registering and logging in users...")
    const authenticatedUsers: { user: any; token: string }[] = []

    for (const user of seedUsers) {
      try {
        // Register the user
        await forumClient.auth.register({
          username: user.username,
          email: user.email,
          password: user.password,
          displayName: user.displayName,
        })
        console.log(`[v0] Registered user: ${user.username}`)

        // Immediately login to get the token
        const loginResponse = await forumClient.auth.login({
          login: user.email,
          password: user.password,
        })
        console.log(`[v0] Logged in user: ${user.username}`)

        // Get user details using the token
        forumClient.setToken(loginResponse.token)
        const userDetails = await forumClient.auth.me()

        authenticatedUsers.push({
          user: userDetails,
          token: loginResponse.token,
        })
        results.users.push(userDetails)

        // Clear token for next iteration
        forumClient.setToken("")
      } catch (e: any) {
        console.log(`[v0] User ${user.username} error:`, e.message)
        results.errors.push(`User ${user.username}: ${e.message}`)
      }
    }

    // Fetch tags to get their IDs
    console.log("[v0] Fetching tags...")
    const tagsResponse = await forumClient.tags.list({})
    const tags = tagsResponse.data || []
    console.log(`[v0] Found ${tags.length} tags`)

    if (authenticatedUsers.length > 0) {
      console.log("[v0] Creating threads...")
      for (let i = 0; i < seedThreads.length; i++) {
        const thread = seedThreads[i]
        const authUser = authenticatedUsers[i % authenticatedUsers.length]

        // Find tag IDs
        const tagIds = thread.tags.map((tagName) => tags.find((t: any) => t.name === tagName)?.id).filter(Boolean)

        try {
          // Set the user's token before creating the thread
          forumClient.setToken(authUser.token)

          const created = await forumClient.threads.create({
            title: thread.title,
            body: thread.body,
            tagIds,
          })
          results.threads.push(created)
          console.log(`[v0] Created thread: ${thread.title.substring(0, 30)}...`)

          // Clear token after creation
          forumClient.setToken("")
        } catch (e: any) {
          console.log(`[v0] Thread creation error:`, e.message)
          results.errors.push(`Thread: ${e.message}`)
        }
      }
    } else {
      results.errors.push("No authenticated users available to create threads")
    }

    return NextResponse.json({
      success: true,
      message: "Seed data created",
      summary: {
        tags: results.tags.length,
        users: results.users.length,
        threads: results.threads.length,
        errors: results.errors.length,
      },
      results,
    })
  } catch (error: any) {
    console.error("[v0] Error seeding data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
