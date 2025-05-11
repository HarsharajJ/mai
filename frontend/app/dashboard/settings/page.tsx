"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { authFetch } from "@/lib/auth-fetch"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  // General settings
  const [botName, setBotName] = useState("Company Assistant")
  const [greeting, setGreeting] = useState("Hello! How can I help you with information about our company?")
  const [debugMode, setDebugMode] = useState(false)

  // API keys
  const [groqApiKey, setGroqApiKey] = useState(process.env.GROQ_API_KEY || "")
  const [cohereApiKey, setCohereApiKey] = useState("")

  // Advanced settings
  const [embeddingModel, setEmbeddingModel] = useState("embed-english-v3.0")
  const [llmModel, setLlmModel] = useState("qwen-qwq-32b")
  const [maxContext, setMaxContext] = useState("4000")
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Fetch settings on page load
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await authFetch("https://mai-2-33v6.onrender.com/settings")
        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }

        const data = await response.json()

        // Update general settings
        setBotName(data.general.botName)
        setGreeting(data.general.greeting)
        setDebugMode(data.general.debugMode)

        // Update API keys
        setGroqApiKey(data.api_keys.groqApiKey)
        setCohereApiKey(data.api_keys.cohereApiKey)

        // Update advanced settings
        setEmbeddingModel(data.advanced.embeddingModel)
        setLlmModel(data.advanced.llmModel)
        setMaxContext(data.advanced.maxContext.toString())
        setAutoRefresh(data.advanced.autoRefresh)
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Failed to fetch settings",
          variant: "destructive",
        })
      } finally {
        setIsLoadingSettings(false)
      }
    }

    fetchSettings()
  }, [])

  const saveGeneralSettings = async () => {
    setIsLoading(true)
    try {
      const response = await authFetch("https://mai-2-33v6.onrender.com/settings/general", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botName,
          greeting,
          debugMode,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save general settings")
      }

      toast({
        title: "Settings saved",
        description: "General settings have been saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save general settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveApiKeys = async () => {
    setIsLoading(true)
    try {
      const response = await authFetch("https://mai-2-33v6.onrender.com/settings/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groqApiKey,
          cohereApiKey,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save API keys")
      }

      toast({
        title: "API keys saved",
        description: "API keys have been saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API keys",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveAdvancedSettings = async () => {
    setIsLoading(true)
    try {
      const response = await authFetch("https://mai-2-33v6.onrender.com/settings/advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeddingModel,
          llmModel,
          maxContext: Number.parseInt(maxContext),
          autoRefresh,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save advanced settings")
      }

      toast({
        title: "Settings saved",
        description: "Advanced settings have been saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save advanced settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingSettings) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general settings for the chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Chatbot Name</Label>
                <Input id="bot-name" value={botName} onChange={(e) => setBotName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="greeting">Welcome Message</Label>
                <Input id="greeting" value={greeting} onChange={(e) => setGreeting(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debug-mode">Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">Show detailed information about responses</p>
                </div>
                <Switch id="debug-mode" checked={debugMode} onCheckedChange={setDebugMode} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveGeneralSettings} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for external services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groq-api-key">Groq API Key</Label>
                <Input
                  id="groq-api-key"
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cohere-api-key">Cohere API Key</Label>
                <Input
                  id="cohere-api-key"
                  type="password"
                  value={cohereApiKey}
                  onChange={(e) => setCohereApiKey(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveApiKeys} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save API Keys"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced settings for the knowledge base</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="embedding-model">Embedding Model</Label>
                <Input
                  id="embedding-model"
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="llm-model">LLM Model</Label>
                <Input id="llm-model" value={llmModel} onChange={(e) => setLlmModel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-context">Max Context Length</Label>
                <Input
                  id="max-context"
                  type="number"
                  value={maxContext}
                  onChange={(e) => setMaxContext(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-refresh">Auto Refresh Knowledge Base</Label>
                  <p className="text-sm text-muted-foreground">Automatically refresh URLs periodically</p>
                </div>
                <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveAdvancedSettings} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Advanced Settings"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
