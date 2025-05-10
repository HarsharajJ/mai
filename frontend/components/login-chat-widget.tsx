"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import ChatWidget from "./chat-widget"

export function LoginChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute -top-2 -right-2 rounded-full z-10 bg-white shadow-md"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </Button>
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="w-[350px] h-[500px] shadow-lg rounded-lg overflow-hidden">
              <ChatWidget />
            </div>
          </div>
        </div>
      ) : (
        <Button
          className="rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle size={24} />
        </Button>
      )}
    </div>
  )
}
