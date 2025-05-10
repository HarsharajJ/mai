import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    // Call the backend login endpoint
    const response = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Login failed" }, { status: response.status })
    }

    const data = await response.json()

    // Get the session cookie from the response
    const cookies = response.headers.getSetCookie()

    // Create a new response
    const nextResponse = NextResponse.json(data)

    // Forward the session cookie to the client
    if (cookies && cookies.length > 0) {
      for (const cookie of cookies) {
        nextResponse.headers.append("Set-Cookie", cookie)
      }
    }

    return nextResponse
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
