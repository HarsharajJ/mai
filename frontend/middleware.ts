import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Check if the request is for the dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Get the session cookie
    const sessionCookie = request.cookies.get("session_id")

    // If there's no session cookie, redirect to login
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      // Verify the session with the backend
      const response = await fetch("https://mai-2-33v6.onrender.com/auth/status", {
        headers: {
          Cookie: `session_id=${sessionCookie.value}`,
        },
        cache: "no-store",
      })

      // If the session is invalid, redirect to login
      if (!response.ok) {
        // Clear the invalid session cookie
        const redirectResponse = NextResponse.redirect(new URL("/login", request.url))
        redirectResponse.cookies.delete("session_id")
        return redirectResponse
      }
    } catch (error) {
      console.error("Authentication error:", error)
      // If there's an error, redirect to login
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
