/**
 * Utility function to make authenticated requests to the backend
 */
export async function authFetch(url: string, options: RequestInit = {}) {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined"
  let cookieHeader = ""

  // Only try to access document.cookie in the browser
  if (isBrowser) {
    const cookies = document.cookie.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=")
        if (key) acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )

    const sessionId = cookies["session_id"]
    if (sessionId) {
      cookieHeader = `session_id=${sessionId}`
    }
  }

  // Set up headers with the session cookie
  const headers = {
    ...options.headers,
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  })

  return response
}
