import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { botName, greeting, debugMode } = await req.json()

    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Call the Python backend to save general settings
    const response = await fetch("http://mai-six.vercel.app/settings/general", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
      body: JSON.stringify({ botName, greeting, debugMode }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || "Failed to save general settings" },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving general settings:", error)
    return NextResponse.json({ error: "Failed to save general settings" }, { status: 500 })
  }
}
