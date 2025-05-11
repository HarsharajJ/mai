import type { NextRequest } from "next/server"

export const maxDuration = 30 // Allow longer API response time

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Invalid query" }, { status: 400 })
    }

    // Connect to your FastAPI backend
    const response = await fetch("http://mai-six.vercel.app/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
      return Response.json(
        { error: errorData.detail || `Backend error: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("API route error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to process your request" },
      { status: 500 },
    )
  }
}
