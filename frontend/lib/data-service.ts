import { authFetch } from "./auth-fetch"

// Types
export type Url = {
  id: string
  url: string
  added_date: string
  status: "processing" | "processed" | "error"
  message?: string
}

export type Pdf = {
  id: string
  filename: string
  added_date: string
  size: number
  status: "processing" | "processed" | "error"
  message?: string
}

export type DashboardStats = {
  totalUrls: number
  totalPdfs: number
  vectorDbSize: number
  urlsLastWeek: number
  pdfsLastWeek: number
  lastUpdated: {
    date: string
    time: string
  }
  systemStatus: Array<{
    name: string
    operational: boolean
  }>
}

export type RecentActivity = Array<{
  id: string
  type: "url" | "pdf" | "url_deleted" | "pdf_deleted"
  name: string
  timeAgo: string
}>

// Functions to fetch data from the backend
export async function getUrls(): Promise<Url[]> {
  try {
    // Use direct fetch to the backend API
    const response = await authFetch("http://localhost:8000/urls")

    if (!response.ok) {
      console.error("Failed to fetch URLs:", response.statusText)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching URLs:", error)
    return []
  }
}

export async function deleteUrl(id: string): Promise<boolean> {
  try {
    const response = await authFetch(`http://localhost:8000/urls/${id}`, {
      method: "DELETE",
    })

    return response.ok
  } catch (error) {
    console.error("Error deleting URL:", error)
    return false
  }
}

export async function getPdfs(): Promise<Pdf[]> {
  try {
    const response = await authFetch("http://localhost:8000/pdfs")

    if (!response.ok) {
      console.error("Failed to fetch PDFs:", response.statusText)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching PDFs:", error)
    return []
  }
}

export async function deletePdf(id: string): Promise<boolean> {
  try {
    const response = await authFetch(`http://localhost:8000/pdfs/${id}`, {
      method: "DELETE",
    })

    return response.ok
  } catch (error) {
    console.error("Error deleting PDF:", error)
    return false
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await authFetch("http://localhost:8000/stats")

    if (!response.ok) {
      console.error("Failed to fetch dashboard stats:", response.statusText)
      return {
        totalUrls: 0,
        totalPdfs: 0,
        vectorDbSize: 0,
        urlsLastWeek: 0,
        pdfsLastWeek: 0,
        lastUpdated: {
          date: "N/A",
          time: "N/A",
        },
        systemStatus: [
          { name: "Vector Database", operational: false },
          { name: "Embedding API", operational: false },
          { name: "LLM API", operational: false },
          { name: "Chat Interface", operational: false },
        ],
      }
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalUrls: 0,
      totalPdfs: 0,
      vectorDbSize: 0,
      urlsLastWeek: 0,
      pdfsLastWeek: 0,
      lastUpdated: {
        date: "N/A",
        time: "N/A",
      },
      systemStatus: [
        { name: "Vector Database", operational: false },
        { name: "Embedding API", operational: false },
        { name: "LLM API", operational: false },
        { name: "Chat Interface", operational: false },
      ],
    }
  }
}

export async function getRecentActivity(): Promise<RecentActivity> {
  try {
    const response = await authFetch("http://localhost:8000/activity")

    if (!response.ok) {
      console.error("Failed to fetch recent activity:", response.statusText)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return []
  }
}
