from app.main import app

# This file is required for many deployment platforms like Heroku or Vercel
# It imports and exposes the FastAPI app created in the app package

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)




