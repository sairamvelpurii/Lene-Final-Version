import os

from dotenv import load_dotenv

load_dotenv()

# Prefer environment variable in production.
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_API_KEY_HERE")
