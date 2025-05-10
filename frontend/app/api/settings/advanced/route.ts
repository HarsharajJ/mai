import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { embeddingModel, llmModel, maxContext, autoRefresh } = await req.json()

    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Call the Python backend to save advanced settings
    const response = await fetch("http://localhost:8000/settings/advanced", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
      body: JSON.stringify({ embeddingModel, llmModel, maxContext, autoRefresh }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || "Failed to save advanced settings" },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving advanced settings:", error)
    return NextResponse.json({ error: "Failed to save advanced settings" }, { status: 500 })
  }
}
