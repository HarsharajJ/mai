import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ChatWidget from "@/components/chat-widget"

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Chat Preview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Chatbot Preview</CardTitle>
            <CardDescription>Test the chatbot with your knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            <ChatWidget />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
            <CardDescription>How to use and test the chatbot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Testing the Chatbot</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the chat interface to test how the chatbot responds to questions about your company.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium">Sample Questions</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-1 space-y-1">
                  <li>What products does our company offer?</li>
                  <li>Tell me about our company history</li>
                  <li>Who are the key people in our organization?</li>
                  <li>What are our company values?</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium">Improving Responses</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  If you notice the chatbot giving incorrect or incomplete answers, consider adding more relevant
                  content through the URL and PDF management sections.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
