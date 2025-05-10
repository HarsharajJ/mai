# Company Chatbot Admin Dashboard

A full-stack application for managing a company knowledge base and AI-powered chatbot. This application allows administrators to upload and manage content (URLs and PDFs) that the chatbot uses to answer questions about the company.

![Dashboard Screenshot](/placeholder.svg?height=400&width=800)

## Features

- **Knowledge Base Management**
  - URL processing and indexing
  - PDF document upload and processing
  - Vector database for semantic search
  
- **AI-powered Chatbot**
  - Retrieval-Augmented Generation (RAG) for accurate responses
  - Context-aware conversations
  - Customizable bot personality and responses
  
- **Admin Dashboard**
  - Secure authentication system
  - Real-time statistics and monitoring
  - Content management interface
  - System settings and configuration
  
- **Responsive Design**
  - Works on desktop and mobile devices
  - Dark/light mode support

## Architecture

### Frontend (Next.js)

The frontend is built with Next.js 14 using the App Router and follows a modern React architecture:

- **App Router**: Utilizes Next.js file-based routing system
- **Server Components**: Leverages React Server Components for improved performance
- **Client Components**: Uses Client Components for interactive elements
- **UI Components**: Built with shadcn/ui component library
- **Authentication**: Custom authentication system with session cookies
- **API Routes**: Next.js API routes for backend communication

### Backend (FastAPI)

The backend is built with FastAPI and provides the following functionality:

- **Authentication**: Session-based authentication system
- **Content Processing**: URL and PDF processing pipeline
- **Vector Database**: FAISS vector database for semantic search
- **AI Integration**: Integration with Groq and Cohere for AI capabilities
- **RESTful API**: Clean API design for frontend communication

### AI Components

The application uses multiple AI services:

- **Groq**: For LLM-based text generation
- **Cohere**: For text embeddings and semantic search
- **RAG System**: Custom Retrieval-Augmented Generation system

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- API keys for Groq and Cohere

### Backend Setup

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/company-chatbot.git
   cd company-chatbot
   \`\`\`

2. Create a Python virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

3. Install Python dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

4. Set up environment variables:
   \`\`\`bash
   # Create a .env file in the backend directory
   GROQ_API_KEY=your_groq_api_key
   COHERE_API_KEY=your_cohere_api_key
   \`\`\`

5. Start the FastAPI server:
   \`\`\`bash
   uvicorn server:app --reload --port 8000
   \`\`\`

### Frontend Setup

1. Navigate to the frontend directory:
   \`\`\`bash
   cd frontend
   \`\`\`

2. Install Node.js dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the Next.js development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Access the application at `http://localhost:3000`

## Usage Guide

### Authentication

- Default admin credentials:
  - Username: `manipaladmin`
  - Password: `manipal@25`

### Managing URLs

1. Navigate to the URL Management page
2. Add new URLs to be processed and indexed
3. View and manage existing URLs
4. Delete URLs that are no longer needed

### Managing PDFs

1. Navigate to the PDF Management page
2. Upload PDF files (max 10MB)
3. View and manage existing PDFs
4. Delete PDFs that are no longer needed

### Chatbot Preview

1. Navigate to the Chat Preview page
2. Test the chatbot with various queries
3. Verify that the chatbot provides accurate responses based on your knowledge base

### Settings

1. Navigate to the Settings page
2. Configure general settings (bot name, greeting, debug mode)
3. Set up API keys for Groq and Cohere
4. Configure advanced settings (embedding model, LLM model, context length)

## API Documentation

### Authentication Endpoints

- `POST /login`: Authenticate a user
- `POST /logout`: Log out a user
- `GET /auth/status`: Check authentication status

### URL Management Endpoints

- `GET /urls`: Get all URLs
- `POST /process-url`: Process and index a new URL
- `DELETE /urls/{url_id}`: Delete a URL

### PDF Management Endpoints

- `GET /pdfs`: Get all PDFs
- `POST /process-pdf`: Process and index a new PDF
- `DELETE /pdfs/{pdf_id}`: Delete a PDF

### Chatbot Endpoints

- `POST /chat`: Send a query to the chatbot

### Settings Endpoints

- `GET /settings`: Get all settings
- `POST /settings/general`: Update general settings
- `POST /settings/api-keys`: Update API keys
- `POST /settings/advanced`: Update advanced settings

## Code Structure

### Frontend Structure

\`\`\`
app/
├── api/                  # API routes
│   ├── auth/             # Authentication API routes
│   ├── chat/             # Chat API routes
│   ├── pdfs/             # PDF management API routes
│   ├── settings/         # Settings API routes
│   └── urls/             # URL management API routes
├── dashboard/            # Dashboard pages
│   ├── chat/             # Chat preview page
│   ├── pdfs/             # PDF management page
│   ├── settings/         # Settings page
│   └── urls/             # URL management page
├── login/                # Login page
├── globals.css           # Global styles
├── layout.tsx            # Root layout
└── page.tsx              # Root page (redirects to dashboard)
components/
├── add-url-form.tsx      # URL addition form
├── chat-widget.tsx       # Chat widget component
├── dashboard-nav.tsx     # Dashboard navigation
├── floating-chat.tsx     # Floating chat button
├── login-chat-widget.tsx # Login page chat widget
├── pdf-upload-form.tsx   # PDF upload form
├── theme-provider.tsx    # Theme provider
└── user-nav.tsx          # User navigation
lib/
├── auth-fetch.ts         # Authentication fetch utility
└── data-service.ts       # Data fetching service
middleware.ts             # Authentication middleware
\`\`\`

### Backend Structure

\`\`\`
server.py                 # Main FastAPI application
data_processor.py         # Data processing and vector database
requirements.txt          # Python dependencies
uploads/                  # Uploaded PDF files
\`\`\`

## Data Flow

1. **Authentication Flow**:
   - User submits login credentials
   - Backend validates credentials and creates a session
   - Frontend stores session cookie
   - Middleware validates session on protected routes

2. **URL Processing Flow**:
   - User submits a URL
   - Backend fetches the URL content
   - Content is processed and embedded
   - Embeddings are stored in the vector database

3. **PDF Processing Flow**:
   - User uploads a PDF
   - Backend extracts text from the PDF
   - Text is processed and embedded
   - Embeddings are stored in the vector database

4. **Chat Flow**:
   - User sends a query
   - Backend searches for relevant documents
   - LLM generates a response based on retrieved documents
   - Response is sent back to the user

## Troubleshooting

### Common Issues

1. **Authentication Issues**:
   - Ensure cookies are enabled in your browser
   - Check that the session cookie is being properly set
   - Verify that the backend is running and accessible

2. **URL Processing Issues**:
   - Ensure the URL is valid and accessible
   - Check that the URL contains relevant content
   - Verify that the Cohere API key is valid

3. **PDF Processing Issues**:
   - Ensure the PDF is not password-protected
   - Check that the PDF size is under 10MB
   - Verify that the PDF contains extractable text

4. **Chat Issues**:
   - Ensure the knowledge base has relevant content
   - Check that the Groq API key is valid
   - Verify that the backend is running and accessible

### Logs

- Frontend logs can be viewed in the browser console
- Backend logs are output to the terminal running the FastAPI server

## Future Improvements

- **Analytics Dashboard**: Detailed analytics on chatbot usage and performance
- **Batch Processing**: Process multiple URLs or PDFs at once
- **Content Preview**: Preview processed content before indexing
- **Webhook Integration**: Integrate with external systems
- **User Management**: Add multiple user accounts with different permissions
- **Custom Training**: Fine-tune the LLM on company-specific data

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Groq](https://groq.com/)
- [Cohere](https://cohere.com/)
- [FAISS](https://github.com/facebookresearch/faiss)
