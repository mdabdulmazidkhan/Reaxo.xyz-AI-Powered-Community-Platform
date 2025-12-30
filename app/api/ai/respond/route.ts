import { forumClient } from "@/lib/forum-client"

const AI_USER_ID = "afb6c21c-34fd-4b9a-80e7-c833eedeb6e3"

const OPENROUTER_API_KEY = "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"

async function generateTextWithDeepSeek(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://reaxo.app",
      "X-Title": "Reaxo Forums",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.log("[v0] OpenRouter error:", error)
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || "I apologize, I couldn't generate a response."
}

export async function POST(req: Request) {
  try {
    const { threadId, threadTitle, threadBody, replyContent, mentionedBy, parentPostId } = await req.json()

    if (!threadId || !replyContent) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Build context for AI
    const systemPrompt = `You are Reaxo AI, a helpful and creative AI assistant participating in a forum discussion. 
You have been mentioned by a user who wants your input. 
Be concise, helpful, and engaging. Keep your response focused and relevant to the discussion.
Format your response using HTML tags for formatting (use <strong> for bold, <ul>/<li> for lists, <code> for code).
Do not include any @ mentions in your response.`

    // Build the context with thread information
    let contextMessage = `Thread Title: "${threadTitle}"\n\n`

    if (threadBody) {
      // Strip HTML for cleaner context
      const cleanBody = threadBody
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
      contextMessage += `Original Post:\n${cleanBody}\n\n`
    }

    // Strip HTML from the reply mentioning AI
    const cleanReply = replyContent
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    contextMessage += `User ${mentionedBy || "Someone"} mentioned you and said:\n${cleanReply}`

    const text = await generateTextWithDeepSeek(systemPrompt, contextMessage)

    // Create the AI reply
    console.log("[v0] Creating AI reply for thread:", threadId, "parentPostId:", parentPostId)

    // Strip HTML for body (API requirement) but keep rich content in extendedData
    const plainTextBody = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    const finalBody = plainTextBody.length < 10 ? plainTextBody.padEnd(10, " ") : plainTextBody

    const createPayload: any = {
      threadId,
      body: finalBody,
      userId: AI_USER_ID,
      extendedData: {
        richContent: text,
        isAiResponse: true,
      },
    }

    // If parentPostId is provided, this AI reply is a response to a specific comment
    if (parentPostId) {
      createPayload.parentId = parentPostId
      console.log("[v0] AI replying to parent post:", parentPostId)
    }

    const aiReply = await forumClient.posts.create(createPayload)

    console.log("[v0] AI reply created successfully:", aiReply.id)

    return Response.json({
      success: true,
      reply: aiReply,
      aiResponse: text,
    })
  } catch (error) {
    console.error("[v0] AI respond error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate AI response" },
      { status: 500 },
    )
  }
}
