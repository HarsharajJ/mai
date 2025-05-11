import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { groqApiKey, cohereApiKey } = await req.json()

    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Call the Python backend to save API keys
    const response = await fetch("https://mai-2-33v6.onrender.com/settings/api-keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
      body: JSON.stringify({ groqApiKey, cohereApiKey }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to save API keys" }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving API keys:", error)
    return NextResponse.json({ error: "Failed to save API keys" }, { status: 500 })
  }
}
