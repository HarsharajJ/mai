import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import PyPDF2
from io import BytesIO
import faiss
import numpy as np
from groq import Groq
from typing import List, Dict, Optional, Any
import json
import time
import cohere
import hashlib
import uuid
from datetime import datetime

# Initialize APIs with default keys
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")
COHERE_API_KEY = os.environ.get("COHERE_API_KEY", "R8KB9BMGC7CftCAt1TLHgu9os1NZjieGhsE3j0oI")

# Configuration
EMBEDDING_MODEL = "embed-english-v3.0"
EMBEDDING_DIM = 1024
DATA_STORE_FILE = "company_data_store.faiss"
METADATA_FILE = "company_metadata.json"
MAX_CONTEXT_LENGTH = 4000

class DataProcessor:
    def __init__(self):
        # Initialize clients
        self.cohere_api_key = COHERE_API_KEY
        self.cohere_client = cohere.Client(self.cohere_api_key)
        
        self.vector_store = None
        self.metadata = []
        self.url_hashes = set()
        self.pdf_hashes = set()
        self.initialize_vector_store()
        
    def update_api_keys(self, cohere_api_key: str):
        """Update the Cohere API key"""
        self.cohere_api_key = cohere_api_key
        self.cohere_client = cohere.Client(self.cohere_api_key)
        
    def update_settings(self, embedding_model: str, max_context: int):
        """Update the embedding model and max context settings"""
        global EMBEDDING_MODEL, MAX_CONTEXT_LENGTH
        EMBEDDING_MODEL = embedding_model
        MAX_CONTEXT_LENGTH = max_context
        
    def initialize_vector_store(self):
        if os.path.exists(DATA_STORE_FILE):
            self.vector_store = faiss.read_index(DATA_STORE_FILE)
            with open(METADATA_FILE, 'r') as f:
                self.metadata = json.load(f)
                # Initialize hashes from existing metadata
                for item in self.metadata:
                    if item['type'] == 'url':
                        self.url_hashes.add(self._hash_url(item['source']))
                    elif item['type'] == 'pdf':
                        self.pdf_hashes.add(self._hash_file(item['source']))
        else:
            self.vector_store = faiss.IndexFlatL2(EMBEDDING_DIM)
            self.metadata = []
            self.url_hashes = set()
            self.pdf_hashes = set()
    
    def _hash_url(self, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()
    
    def _hash_file(self, filepath: str) -> str:
        try:
            with open(filepath, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception as e:
            print(f"Error hashing file {filepath}: {e}")
            return hashlib.md5(filepath.encode()).hexdigest()
    
    def save_data_store(self):
        faiss.write_index(self.vector_store, DATA_STORE_FILE)
        with open(METADATA_FILE, 'w') as f:
            json.dump(self.metadata, f)
    
    def get_embedding(self, text: str) -> Optional[List[float]]:
        try:
            response = self.cohere_client.embed(
                texts=[text],
                model=EMBEDDING_MODEL,
                input_type="search_document"
            )
            return response.embeddings[0]
        except Exception as e:
            print(f"Embedding error: {str(e)}")
            return None
    
    def extract_text_from_url(self, url: str) -> Optional[str]:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            if response.headers.get('content-type', '').startswith('application/pdf'):
                return self.extract_text_from_pdf(BytesIO(response.content))
            
            soup = BeautifulSoup(response.text, 'html.parser')
            for element in soup(['script', 'style', 'nav', 'footer', 'header']):
                element.decompose()
                
            main_content = soup.find('main') or soup.find('article') or soup.body
            text = main_content.get_text(separator=' ', strip=True)
            return text[:MAX_CONTEXT_LENGTH] if len(text) > MAX_CONTEXT_LENGTH else text
            
        except Exception as e:
            print(f"URL processing error: {str(e)}")
            return None
    
    def extract_text_from_pdf(self, pdf_file) -> str:
        try:
            reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text[:MAX_CONTEXT_LENGTH] if len(text) > MAX_CONTEXT_LENGTH else text
        except Exception as e:
            print(f"PDF processing error: {str(e)}")
            return ""
    
    def process_url(self, url: str) -> Dict:
        """Process a single URL and return metadata about the processing"""
        url_hash = self._hash_url(url)
        if url_hash in self.url_hashes:
            return {
                "id": str(uuid.uuid4()),
                "url": url,
                "added_date": datetime.now().isoformat(),
                "status": "processed",
                "message": "URL already processed"
            }
            
        print(f"Processing URL: {url}")
        text = self.extract_text_from_url(url)
        if not text:
            return {
                "id": str(uuid.uuid4()),
                "url": url,
                "added_date": datetime.now().isoformat(),
                "status": "error",
                "message": "Failed to extract text from URL"
            }
                
        embedding = None
        for _ in range(3):
            embedding = self.get_embedding(text)
            if embedding is not None:
                break
            time.sleep(1)
                
        if embedding is None:
            return {
                "id": str(uuid.uuid4()),
                "url": url,
                "added_date": datetime.now().isoformat(),
                "status": "error",
                "message": "Failed to generate embedding"
            }
                
        metadata = {
            'source': url,
            'text': text,
            'type': 'url',
            'added_date': datetime.now().isoformat()
        }
            
        self._update_vector_store([embedding], [metadata])
        self.url_hashes.add(url_hash)
        
        return {
            "id": str(uuid.uuid4()),
            "url": url,
            "added_date": datetime.now().isoformat(),
            "status": "processed",
            "message": "URL processed successfully"
        }
    
    def process_urls(self, urls: List[str]) -> List[Dict]:
        """Process multiple URLs and return metadata about each"""
        self.initialize_vector_store()
        results = []
        
        # First identify which URLs need processing
        urls_to_process = []
        for url in urls:
            url_hash = self._hash_url(url)
            if url_hash not in self.url_hashes:
                urls_to_process.append(url)
        
        if not urls_to_process:
            print("All URLs already processed. Skipping URL processing.")
            return [{"id": str(uuid.uuid4()), "url": url, "added_date": datetime.now().isoformat(), "status": "processed", "message": "URL already processed"} for url in urls]
            
        print(f"Processing {len(urls_to_process)} new URLs out of {len(urls)} total URLs")
        
        for url in urls_to_process:
            result = self.process_url(url)
            results.append(result)
            
        return results
    
    def process_pdf(self, pdf_path: str, original_filename: str = None) -> Dict:
        """Process a single PDF and return metadata about the processing"""
        self.initialize_vector_store()
        
        file_hash = self._hash_file(pdf_path)
        if file_hash in self.pdf_hashes:
            return {
                "id": str(uuid.uuid4()),
                "filename": original_filename or pdf_path,
                "added_date": datetime.now().isoformat(),
                "status": "processed",
                "message": "PDF already processed",
                "size": os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
            }
            
        print(f"Processing PDF: {pdf_path}")
        try:
            with open(pdf_path, 'rb') as f:
                text = self.extract_text_from_pdf(f)
                if not text:
                    return {
                        "id": str(uuid.uuid4()),
                        "filename": original_filename or pdf_path,
                        "added_date": datetime.now().isoformat(),
                        "status": "error",
                        "message": "Failed to extract text from PDF",
                        "size": os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
                    }
                
                embedding = None
                for _ in range(3):
                    embedding = self.get_embedding(text)
                    if embedding is not None:
                        break
                    time.sleep(1)
                    
                if embedding is None:
                    return {
                        "id": str(uuid.uuid4()),
                        "filename": original_filename or pdf_path,
                        "added_date": datetime.now().isoformat(),
                        "status": "error",
                        "message": "Failed to generate embedding",
                        "size": os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
                    }
                
                metadata = {
                    'source': pdf_path,
                    'text': text,
                    'type': 'pdf',
                    'added_date': datetime.now().isoformat(),
                    'original_filename': original_filename or pdf_path
                }
                
                self._update_vector_store([embedding], [metadata])
                self.pdf_hashes.add(file_hash)
                
                return {
                    "id": str(uuid.uuid4()),
                    "filename": original_filename or pdf_path,
                    "added_date": datetime.now().isoformat(),
                    "status": "processed",
                    "message": "PDF processed successfully",
                    "size": os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
                }
        except Exception as e:
            print(f"Error processing PDF: {str(e)}")
            return {
                "id": str(uuid.uuid4()),
                "filename": original_filename or pdf_path,
                "added_date": datetime.now().isoformat(),
                "status": "error",
                "message": f"Error processing PDF: {str(e)}",
                "size": os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
            }
    
    def _update_vector_store(self, new_embeddings: list, new_metadata: list):
        new_embeddings_np = np.array(new_embeddings).astype('float32')
        
        if self.vector_store.ntotal == 0:
            self.vector_store.add(new_embeddings_np)
            self.metadata.extend(new_metadata)
        else:
            existing_embeddings = self.vector_store.reconstruct_n(0, self.vector_store.ntotal)
            combined_embeddings = np.vstack([existing_embeddings, new_embeddings_np])
            
            self.vector_store = faiss.IndexFlatL2(EMBEDDING_DIM)
            self.vector_store.add(combined_embeddings)
            self.metadata.extend(new_metadata)
        
        self.save_data_store()
    
    def get_all_urls(self) -> List[Dict]:
        """Get all URLs in the knowledge base"""
        self.initialize_vector_store()
        urls = []
        for item in self.metadata:
            if item['type'] == 'url':
                urls.append({
                    "id": str(uuid.uuid4()),  # Generate a new ID for the API
                    "url": item['source'],
                    "added_date": item.get('added_date', datetime.now().isoformat()),
                    "status": "processed"
                })
        return urls
    
    def get_all_pdfs(self) -> List[Dict]:
        """Get all PDFs in the knowledge base"""
        self.initialize_vector_store()
        pdfs = []
        for item in self.metadata:
            if item['type'] == 'pdf':
                pdfs.append({
                    "id": str(uuid.uuid4()),  # Generate a new ID for the API
                    "filename": item.get('original_filename', item['source']),
                    "added_date": item.get('added_date', datetime.now().isoformat()),
                    "status": "processed",
                    "size": os.path.getsize(item['source']) if os.path.exists(item['source']) else 0
                })
        return pdfs
    
    def get_vector_db_size(self) -> int:
        """Get the size of the vector database"""
        self.initialize_vector_store()
        return self.vector_store.ntotal
    
    def search_relevant_documents(self, query: str, k: int = 3) -> List[Dict]:
        """Search for relevant documents given a query"""
        self.initialize_vector_store()
        
        if self.vector_store.ntotal == 0:
            return []
        
        try:
            response = self.cohere_client.embed(
                texts=[query],
                model=EMBEDDING_MODEL,
                input_type="search_query"
            )
            query_embedding = response.embeddings[0]
        except Exception as e:
            print(f"Query embedding error: {str(e)}")
            return []
        
        query_embedding_np = np.array([query_embedding]).astype('float32')
        distances, indices = self.vector_store.search(query_embedding_np, k)
        
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx < len(self.metadata):
                result = self.metadata[idx].copy()
                result['distance'] = float(distance)
                results.append(result)
        
        return results


class Chatbot:
    def __init__(self):
        # Initialize with environment variables if available
        self.groq_api_key = GROQ_API_KEY
        self.llm_model = "qwen-qwq-32b"
        self.max_context = 4000
        self.bot_name = "Company Assistant"
        self.greeting = "Hello! How can I help you with information about our company?"
        self.debug_mode = False
        
        # Initialize data processor
        self.data_processor = DataProcessor()
        
        # Initialize Groq client
        self.groq_client = Groq(api_key=self.groq_api_key)
        
        # Greetings dictionary
        self.greetings = {
            "hi": "Hello! How can I help you with information about our company?",
            "hello": "Hi there! What would you like to know about our company?",
            "hey": "Hey! I'm here to answer your questions about our company?",
            "good morning": "Good morning! How can I assist you with information about our company?",
            "good afternoon": "Good afternoon! What would you like to know about our company?",
            "good evening": "Good evening! How can I help you with information about our company today?"
        }
        
        # Chat memory
        self.memory = []
        self.memory_file = "chatbot_memory.json"
        self.load_memory()
    
    def load_memory(self):
        """Load the chat memory from a file"""
        try:
            if os.path.exists(self.memory_file):
                with open(self.memory_file, 'r') as f:
                    self.memory = json.load(f)
        except Exception as e:
            print(f"Error loading memory: {e}")
            self.memory = []
    
    def save_memory(self):
        """Save the chat memory to a file"""
        try:
            with open(self.memory_file, 'w') as f:
                json.dump(self.memory, f)
        except Exception as e:
            print(f"Error saving memory: {e}")
    
    def update_api_keys(self, groq_api_key: str):
        """Update the Groq API key"""
        self.groq_api_key = groq_api_key
        self.groq_client = Groq(api_key=self.groq_api_key)
    
    def update_settings(self, llm_model: str, max_context: int, bot_name: str = None, greeting: str = None, debug_mode: bool = None):
        """Update the LLM model and max context settings"""
        self.llm_model = llm_model
        self.max_context = max_context
        
        if bot_name is not None:
            self.bot_name = bot_name
            # Update greetings with new bot name
            for key in self.greetings:
                self.greetings[key] = self.greetings[key].replace("our company", self.bot_name)
        
        if greeting is not None:
            self.greeting = greeting
            # Update default greeting
            self.greetings["hi"] = greeting
        
        if debug_mode is not None:
            self.debug_mode = debug_mode
    
    def is_greeting(self, query: str) -> bool:
        """Check if the query is a greeting"""
        query_lower = query.lower().strip()
        return query_lower in self.greetings
    
    def handle_greeting(self, query: str) -> str:
        """Handle greeting queries"""
        query_lower = query.lower().strip()
        return self.greetings.get(query_lower, self.greeting)
    
    def generate_response(self, query: str) -> str:
        """Generate a response to a query using RAG"""
        # Check for greetings first
        if self.is_greeting(query):
            response = self.handle_greeting(query)
            
            # Add to memory
            self.memory.append({
                "query": query,
                "response": response,
                "timestamp": datetime.now().isoformat()
            })
            self.save_memory()
            
            return response
        
        try:
            # Search for relevant documents
            relevant_docs = self.data_processor.search_relevant_documents(query)
            
            if not relevant_docs:
                response = f"I couldn't find relevant information to answer your question. Please try asking about something else related to {self.bot_name}."
                
                # Add to memory
                self.memory.append({
                    "query": query,
                    "response": response,
                    "timestamp": datetime.now().isoformat()
                })
                self.save_memory()
                
                return response
            
            # Prepare context
            context = "\n\n".join([doc['text'] for doc in relevant_docs])
            
            # Truncate context if too long
            if len(context) > self.max_context:
                context = context[:self.max_context]
            
            # Prepare prompt with proper Python string formatting
            prompt = f"""You are a helpful assistant for {self.bot_name}. 
            Answer based strictly on this context. If the answer isn't here, say:
            "I don't have that information in my knowledge base. Please contact us at Email: info@manipaltechnologies.com or Phone: +91 820 2205000  for more details."

            Important: 
            - Provide only the direct answer without any thinking process or analysis
            - Remove any markdown formatting like **, _, etc.
            - Do not include any text like <Thinking> or reasoning before the answer
            - Just provide the clean, factual answer directly

            Context: {context}

            Question: {query}

            Answer:"""
            
            # Generate response using Groq
            chat_completion = self.groq_client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": f"You are a helpful assistant for {self.bot_name}."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            # Get the raw response and clean it
            response = chat_completion.choices[0].message.content.strip()
            
            # Remove any thinking patterns if they somehow still appear
            if '<think>' in response.lower():
                response = response.split('</think>')[-1].strip()
            # Remove markdown formatting
            response = response.replace('**', '').replace('__', '').replace('_', '')
            
            
            # Add debug information if debug mode is enabled
            if self.debug_mode:
                debug_info = "\n\n---\nDebug Info:\n"
                debug_info += f"Model: {self.llm_model}\n"
                debug_info += f"Sources: {', '.join([doc.get('source', 'Unknown') for doc in relevant_docs])}\n"
                response += debug_info
            
            # Add to memory
            self.memory.append({
                "query": query,
                "response": response,
                "timestamp": datetime.now().isoformat()
            })
            self.save_memory()
            
            return response
            
        except Exception as e:
            print(f"Error generating response: {e}")
            response = f"I'm sorry, I encountered an error: {str(e)}"
            
            # Add to memory
            self.memory.append({
                "query": query,
                "response": response,
                "timestamp": datetime.now().isoformat()
            })
            self.save_memory()
            
            return response