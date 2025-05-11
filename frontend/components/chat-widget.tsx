"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, AlertCircle } from "lucide-react"

type Message = {
  id: string
  content: string
  role: "user" | "assistant" | "error"
  timestamp: Date
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initial greeting message
  useEffect(() => {
    setMessages([
      {
        id: "1",
        content: "Hello! How can I help you with information about our company or the admin portal?",
        role: "assistant",
        timestamp: new Date(),
      },
    ])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: input }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm sorry, I couldn't process your request.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : "I'm sorry, there was an error processing your request. Please try again.",
        role: "error",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-white">
      <div className="bg-primary text-primary-foreground p-3 font-semibold flex items-center gap-2">
        <Bot size={18} />
        <span>MTL Chatbot</span>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : message.role === "error"
                    ? "bg-red-100 text-red-800 rounded-tl-none"
                    : "bg-muted text-foreground rounded-tl-none"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.role === "assistant" ? (
                  <Bot size={16} />
                ) : message.role === "error" ? (
                  <AlertCircle size={16} className="text-red-600" />
                ) : (
                  <User size={16} />
                )}
                <span className="text-xs opacity-75">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-grow text-sm"
          />
          <Button type="submit" disabled={isLoading} size="icon" className="shrink-0">
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  )
}
