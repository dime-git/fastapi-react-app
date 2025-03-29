import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create empty class that just returns empty results instead of failing
class EmptyFirestore:
    def collection(self, name):
        return self
    
    def document(self, id):
        return self
    
    def get(self):
        return None
    
    def where(self, *args, **kwargs):
        return self
    
    def limit(self, limit):
        return self
    
    def order_by(self, field, direction=None):
        return self

# For secure deployment, we use multiple ways to get Firebase credentials
def initialize_firebase():
    try:
        # Try to get default app if already initialized
        default_app = firebase_admin.get_app()
        return default_app
    except ValueError:
        # Initialize if not already done
        # Try to use the service account file directly
        service_account_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../serviceAccountKey.json'))
        
        if os.path.exists(service_account_path):
            # Use the file if it exists
            cred = credentials.Certificate(service_account_path)
            default_app = firebase_admin.initialize_app(cred)
            return default_app
        else:
            # Try to get the Firebase credentials from environment variable
            firebase_creds_env = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
            
            if firebase_creds_env:
                # Parse JSON from environment variable
                cred_dict = json.loads(firebase_creds_env)
                cred = credentials.Certificate(cred_dict)
                default_app = firebase_admin.initialize_app(cred)
                return default_app
            else:
                # Use individual credential components from environment variables
                private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
                
                # Handle different potential formats of the private key
                if private_key.startswith('"') and private_key.endswith('"'):
                    private_key = private_key[1:-1]  # Remove surrounding quotes
                
                # Replace literal "\n" with actual newlines
                if "\\n" in private_key:
                    private_key = private_key.replace("\\n", "\n")
                
                # Create credentials dictionary
                cred_dict = {
                    "type": "service_account",
                    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", ""),
                    "private_key": private_key,
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                    "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                    "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
                    "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
                    "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
                    "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
                }
                
                cred = credentials.Certificate(cred_dict)
                default_app = firebase_admin.initialize_app(cred)
                return default_app

# Try to initialize Firebase
try:
    app = initialize_firebase()
    # Get Firestore client
    db = firestore.client()
except Exception as e:
    print(f"Failed to initialize Firebase: {e}")
    # Allow the app to at least start up, even without Firebase
    app = None
    db = None

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# App Settings
PORT = int(os.getenv("PORT", 8000))
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t") 