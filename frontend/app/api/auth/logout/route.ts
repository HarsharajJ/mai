import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Call the backend logout endpoint
    const response = await fetch("https://mai-2-33v6.onrender.com/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Logout failed" }, { status: response.status })
    }

    const data = await response.json()

    // Create a new response
    const nextResponse = NextResponse.json(data)

    // Clear the session cookie
    nextResponse.cookies.delete("session_id")

    return nextResponse
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
