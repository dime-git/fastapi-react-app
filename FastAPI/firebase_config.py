import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK (you need to place your service account JSON file in this directory)
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)

# Get Firestore client
db = firestore.client()

# Collection references
transactions_ref = db.collection('transactions') 