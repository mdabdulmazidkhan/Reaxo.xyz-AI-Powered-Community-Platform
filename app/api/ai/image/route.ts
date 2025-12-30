import { forumClient } from "@/lib/forum-client"

const AI_USER_ID = "afb6c21c-34fd-4b9a-80e7-c833eedeb6e3"
const RUNWARE_API_KEY = "2PQTNVSV4paGgA3pz55kqdW1DTLd61Hc"

async function generateImageWithRunware(prompt: string): Promise<string | null> {
  try {
    console.log("[v0] Generating image with Runware, prompt:", prompt.substring(0, 100))

    // Generate a UUID for the task
    const taskUUID = crypto.randomUUID()

    const response = await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RUNWARE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          taskType: "imageInference",
          taskUUID: taskUUID,
          outputType: "URL",
          outputFormat: "WEBP",
          positivePrompt: prompt,
          height: 1024,
          width: 1024,
          model: "runware:101@1",
          steps: 30,
          CFGScale: 7.5,
          numberResults: 1,
        },
      ]),
    })

    if (!response.ok) {
      const error = await response.text()
      console.log("[v0] Runware error:", error)
      return null
    }

    const data = await response.json()
    console.log("[v0] Runware response:", JSON.stringify(data))

    // Runware returns an array of results
    if (data && data.data && data.data.length > 0) {
      const result = data.data[0]
      if (result.imageURL) {
        console.log("[v0] Image generated successfully:", result.imageURL)
        return result.imageURL
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Image generation error:", error)
    return null
  }
}

function extractImagePrompt(content: string, threadTitle: string, threadBody: string): string {
  // Strip HTML tags from content
  const cleanContent = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/@image/gi, "")
    .trim()

  // Strip HTML from thread body
  const cleanBody = threadBody
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // Build a prompt combining context and user request
  let prompt = ""

  // If user provided specific instructions, use them
  if (cleanContent.length > 5) {
    prompt = cleanContent
  } else {
    // Use thread context to generate relevant image
    prompt = `${threadTitle}. ${cleanBody.substring(0, 200)}`
  }

  // Add quality enhancers
  prompt = `${prompt}, high quality, detailed, professional`

  return prompt.substring(0, 500) // Limit prompt length
}

export async function POST(req: Request) {
  try {
    const { threadId, threadTitle, threadBody, replyContent, mentionedBy, parentPostId } = await req.json()

    if (!threadId || !replyContent) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Extract image prompt from content and context
    const imagePrompt = extractImagePrompt(replyContent, threadTitle || "", threadBody || "")
    console.log("[v0] Image generation prompt:", imagePrompt)

    // Generate the image
    const generatedImageUrl = await generateImageWithRunware(imagePrompt)

    const buildPayload = (body: string, richContent: string, generatedImage?: string | null): any => {
      const payload: any = {
        threadId,
        body: body.length < 10 ? body.padEnd(10, " ") : body,
        userId: AI_USER_ID,
        extendedData: {
          richContent,
          isAiResponse: true,
          isImageResponse: true,
          generatedImage: generatedImage || undefined,
          imagePrompt: imagePrompt,
        },
      }

      if (parentPostId) {
        payload.parentId = parentPostId
        console.log("[v0] Image AI replying to parent post:", parentPostId)
      }

      return payload
    }

    if (!generatedImageUrl) {
      // Create a reply explaining the failure
      const errorBody =
        "I apologize, but I couldn't generate an image at this time. Please try again with a different description."

      const errorReply = await forumClient.posts.create(buildPayload(errorBody, `<p>${errorBody}</p>`))

      return Response.json({
        success: false,
        reply: errorReply,
        error: "Failed to generate image",
      })
    }

    // Build the response HTML with the generated image
    const responseText = `Here's the image I generated based on "${imagePrompt.substring(0, 100)}${imagePrompt.length > 100 ? "..." : ""}"`
    const aiResponseHtml = `<p>${responseText}</p><img src="${generatedImageUrl}" alt="AI Generated Image" class="mt-3 rounded-lg max-w-full" />`

    // Create the AI reply
    console.log("[v0] Creating image AI reply for thread:", threadId, "parentPostId:", parentPostId)

    const aiReply = await forumClient.posts.create(buildPayload(responseText, aiResponseHtml, generatedImageUrl))

    console.log("[v0] Image AI reply created successfully:", aiReply.id)

    return Response.json({
      success: true,
      reply: aiReply,
      aiResponse: aiResponseHtml,
      generatedImage: generatedImageUrl,
    })
  } catch (error) {
    console.error("[v0] Image AI respond error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 },
    )
  }
}
