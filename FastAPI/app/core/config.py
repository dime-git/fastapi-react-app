import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Global flags
MOCK_FIREBASE = os.getenv("MOCK_FIREBASE", "False").lower() in ("true", "1", "t")

# For secure deployment, we support multiple ways to get Firebase credentials:
# 1. Direct file path (local development)
# 2. JSON content in environment variable (cloud deployment)
# 3. Mock mode for deployment without Firebase
def initialize_firebase():
    # If mock mode is enabled, return a mock app
    if MOCK_FIREBASE:
        print("⚠️ USING MOCK FIREBASE MODE - No authentication or database access will work!")
        class MockDB:
            def collection(self, name):
                return self
            def document(self, id):
                return self
            def get(self):
                return None
            def set(self, data):
                return None
            def update(self, data):
                return None
            def delete(self):
                return None
            def where(self, field, op, value):
                return self
        
        # Create a global db object for mock mode
        global db
        db = MockDB()
        return None  # No actual Firebase app in mock mode
    
    try:
        # Try to get default app if already initialized
        default_app = firebase_admin.get_app()
        return default_app
    except ValueError:
        # Initialize if not already done
        try:
            # Method 1: Try to use the service account file directly
            service_account_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../serviceAccountKey.json'))
            
            if os.path.exists(service_account_path):
                # Use the file if it exists
                print(f"Using service account file at {service_account_path}")
                cred = credentials.Certificate(service_account_path)
            else:
                # Method 2: Try to get the Firebase credentials from environment variable
                firebase_creds_env = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
                
                if firebase_creds_env:
                    try:
                        # Parse JSON from environment variable
                        print("Using FIREBASE_SERVICE_ACCOUNT_JSON environment variable")
                        cred_dict = json.loads(firebase_creds_env)
                        cred = credentials.Certificate(cred_dict)
                    except Exception as json_error:
                        print(f"Error parsing JSON credentials: {json_error}")
                        # Fall back to method 3 if JSON parsing fails
                        firebase_creds_env = None
                
                if not firebase_creds_env:
                    # Method 3: Use individual credential components from environment variables
                    private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
                    
                    # Handle different potential formats of the private key in environment variables
                    if private_key.startswith('"') and private_key.endswith('"'):
                        private_key = private_key[1:-1]  # Remove surrounding quotes
                    
                    # Replace literal "\n" with actual newlines
                    if "\\n" in private_key:
                        private_key = private_key.replace("\\n", "\n")
                    
                    print("Using individual environment variables for Firebase credentials")
                    
                    # Check if we have sufficient credentials
                    project_id = os.getenv("FIREBASE_PROJECT_ID")
                    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
                    
                    if not (project_id and client_email and private_key):
                        print("⚠️ Missing required Firebase credentials, switching to MOCK mode")
                        # Enable mock mode since we don't have credentials
                        global MOCK_FIREBASE
                        MOCK_FIREBASE = True
                        # Create a mock DB
                        global db
                        class MockDB:
                            def collection(self, name):
                                return self
                            def document(self, id):
                                return self
                            def get(self):
                                return None
                            def set(self, data):
                                return None
                            def update(self, data):
                                return None
                            def delete(self):
                                return None
                            def where(self, field, op, value):
                                return self
                        db = MockDB()
                        return None
                    
                    # Print debug info about the private key (safe version for logs)
                    pk_length = len(private_key) if private_key else 0
                    pk_preview = private_key[:10] + "..." if pk_length > 10 else ""
                    print(f"Private key length: {pk_length}, Preview: {pk_preview}")
                    print("Private key contains actual newlines:", "\n" in private_key)
                    
                    cred_dict = {
                        "type": "service_account",
                        "project_id": project_id,
                        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", ""),
                        "private_key": private_key,
                        "client_email": client_email,
                        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                        "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
                        "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
                        "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
                        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
                    }
                    cred = credentials.Certificate(cred_dict)
            
            default_app = firebase_admin.initialize_app(cred)
            print("Firebase initialized successfully")
            # Get Firestore client
            global db
            db = firestore.client()
            return default_app
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            print("⚠️ Switching to MOCK mode due to Firebase initialization error")
            # Enable mock mode due to error
            global MOCK_FIREBASE
            MOCK_FIREBASE = True
            # Create a mock DB
            global db
            class MockDB:
                def collection(self, name):
                    return self
                def document(self, id):
                    return self
                def get(self):
                    return None
                def set(self, data):
                    return None
                def update(self, data):
                    return None
                def delete(self):
                    return None
                def where(self, field, op, value):
                    return self
            db = MockDB()
            return None

# Initialize Firebase
app = initialize_firebase()

# DB is either initialized above or a mock object
if 'db' not in globals():
    # This should never happen with our updated logic, but just in case
    db = None  

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# App Settings
PORT = int(os.getenv("PORT", 8000))
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t") 