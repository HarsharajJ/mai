"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, RefreshCw, ExternalLink, AlertCircle, Loader2 } from "lucide-react"
import { AddUrlForm } from "@/components/add-url-form"
import { getUrls, deleteUrl } from "@/lib/data-service"
import { toast } from "@/hooks/use-toast"
import type { Url } from "@/lib/data-service"

export default function UrlsPage() {
  const [urls, setUrls] = useState<Url[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const fetchUrls = async () => {
    setIsLoading(true)
    try {
      const data = await getUrls()
      setUrls(data)
    } catch (error) {
      console.error("Error fetching URLs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch URLs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUrl = async (id: string) => {
    setIsDeleting(id)
    try {
      const success = await deleteUrl(id)
      if (success) {
        setUrls(urls.filter((url) => url.id !== id))
        toast({
          title: "URL deleted",
          description: "The URL has been deleted successfully",
        })
      } else {
        throw new Error("Failed to delete URL")
      }
    } catch (error) {
      console.error("Error deleting URL:", error)
      toast({
        title: "Error",
        description: "Failed to delete URL",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  useEffect(() => {
    fetchUrls()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">URL Management</h2>
        <Button onClick={fetchUrls} disabled={isLoading} className="flex items-center gap-1">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Processed URLs</CardTitle>
            <CardDescription>URLs that have been processed and indexed in the knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        <div className="flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : urls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No URLs have been added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    urls.map((url) => (
                      <TableRow key={url.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[300px]">{url.url}</span>
                            <a href={url.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(url.added_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                url.status === "processed"
                                  ? "bg-green-500"
                                  : url.status === "processing"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            ></div>
                            <span>
                              {url.status === "processed"
                                ? "Processed"
                                : url.status === "processing"
                                  ? "Processing"
                                  : "Error"}
                            </span>
                            {url.status === "error" && url.message && (
                              <div className="relative group">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <div className="absolute left-0 top-6 z-10 hidden w-48 rounded-md bg-black p-2 text-xs text-white group-hover:block">
                                  {url.message}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleDeleteUrl(url.id)}
                            variant="ghost"
                            size="icon"
                            disabled={isDeleting === url.id}
                          >
                            {isDeleting === url.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New URL</CardTitle>
            <CardDescription>Add a new URL to be processed and indexed</CardDescription>
          </CardHeader>
          <CardContent>
            <AddUrlForm onSuccess={fetchUrls} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
