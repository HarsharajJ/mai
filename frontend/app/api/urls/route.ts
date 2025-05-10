import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Call the Python backend to process the URL
    const response = await fetch("http://localhost:8000/process-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to process URL" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error processing URL:", error)
    return NextResponse.json({ error: "Failed to process URL" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Call the Python backend to get all URLs
    const response = await fetch("http://localhost:8000/urls", {
      headers: {
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to fetch URLs" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching URLs:", error)
    return NextResponse.json({ error: "Failed to fetch URLs" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "URL ID is required" }, { status: 400 })
    }

    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Call the Python backend to delete the URL
    const response = await fetch(`http://localhost:8000/urls/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to delete URL" }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting URL:", error)
    return NextResponse.json({ error: "Failed to delete URL" }, { status: 500 })
  }
}
