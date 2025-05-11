import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    // Check if file is a PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 })
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Create a new FormData object to send to the Python backend
    const backendFormData = new FormData()
    backendFormData.append("file", file)

    // Call the Python backend to process the PDF
    const response = await fetch("http://mai-six.vercel.app/process-pdf", {
      method: "POST",
      headers: {
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
      body: backendFormData,
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to process PDF" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error processing PDF:", error)
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Call the Python backend to get all PDFs
    const response = await fetch("http://mai-six.vercel.app/pdfs", {
      headers: {
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to fetch PDFs" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching PDFs:", error)
    return NextResponse.json({ error: "Failed to fetch PDFs" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "PDF ID is required" }, { status: 400 })
    }

    // Get the session cookie
    const sessionCookie = req.cookies.get("session_id")

    // Call the Python backend to delete the PDF
    const response = await fetch(`http://mai-six.vercel.app/pdfs/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: sessionCookie ? `session_id=${sessionCookie.value}` : "",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to delete PDF" }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting PDF:", error)
    return NextResponse.json({ error: "Failed to delete PDF" }, { status: 500 })
  }
}
