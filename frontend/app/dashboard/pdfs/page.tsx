"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Trash2, FileText, AlertCircle, Loader2 } from "lucide-react"
import { PdfUploadForm } from "@/components/pdf-upload-form"
import { getPdfs, deletePdf } from "@/lib/data-service"
import { toast } from "@/hooks/use-toast"
import type { Pdf } from "@/lib/data-service"

export default function PdfsPage() {
  const [pdfs, setPdfs] = useState<Pdf[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const fetchPdfs = async () => {
    setIsLoading(true)
    try {
      const data = await getPdfs()
      setPdfs(data)
    } catch (error) {
      console.error("Error fetching PDFs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch PDFs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePdf = async (id: string) => {
    setIsDeleting(id)
    try {
      const success = await deletePdf(id)
      if (success) {
        setPdfs(pdfs.filter((pdf) => pdf.id !== id))
        toast({
          title: "PDF deleted",
          description: "The PDF has been deleted successfully",
        })
      } else {
        throw new Error("Failed to delete PDF")
      }
    } catch (error) {
      console.error("Error deleting PDF:", error)
      toast({
        title: "Error",
        description: "Failed to delete PDF",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  useEffect(() => {
    fetchPdfs()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">PDF Management</h2>
        <Button onClick={fetchPdfs} disabled={isLoading} className="flex items-center gap-1">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Processed PDFs</CardTitle>
            <CardDescription>PDF files that have been processed and indexed in the knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        <div className="flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : pdfs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No PDFs have been uploaded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    pdfs.map((pdf) => (
                      <TableRow key={pdf.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span>{pdf.filename}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(pdf.added_date).toLocaleDateString()}</TableCell>
                        <TableCell>{(pdf.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                pdf.status === "processed"
                                  ? "bg-green-500"
                                  : pdf.status === "processing"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            ></div>
                            <span>
                              {pdf.status === "processed"
                                ? "Processed"
                                : pdf.status === "processing"
                                  ? "Processing"
                                  : "Error"}
                            </span>
                            {pdf.status === "error" && pdf.message && (
                              <div className="relative group">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <div className="absolute left-0 top-6 z-10 hidden w-48 rounded-md bg-black p-2 text-xs text-white group-hover:block">
                                  {pdf.message}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleDeletePdf(pdf.id)}
                            variant="ghost"
                            size="icon"
                            disabled={isDeleting === pdf.id}
                          >
                            {isDeleting === pdf.id ? (
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
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>Upload a new PDF file to be processed and indexed</CardDescription>
          </CardHeader>
          <CardContent>
            <PdfUploadForm onSuccess={fetchPdfs} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
