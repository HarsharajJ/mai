"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"

interface AddUrlFormProps {
  onSuccess?: () => void
}

export function AddUrlForm({ onSuccess }: AddUrlFormProps) {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url) return

    // Validate URL
    try {
      new URL(url)
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await authFetch("https://mai-2-33v6.onrender.com/process-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add URL")
      }

      toast({
        title: "URL added successfully",
        description: "The URL has been added to the processing queue",
      })

      setUrl("")

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Failed to add URL",
        description: error instanceof Error ? error.message : "There was an error adding the URL",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Add URL
          </>
        )}
      </Button>
    </form>
  )
}
