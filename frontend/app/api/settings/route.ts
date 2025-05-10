import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Call the Python backend to get settings
    const response = await fetch("http://localhost:8000/settings", {
      headers: {
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to fetch settings" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}
