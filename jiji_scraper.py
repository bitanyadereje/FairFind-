from curl_cffi import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
)

@app.get("/scrape")
async def scrape(category: str):
    url = f"https://jiji.et/{category}"
    try:
        response = requests.get(url, impersonate="chrome", verify=False, timeout=30)
        return {"html": response.text, "status": response.status_code}
    except Exception as e:
        return {"error": str(e), "status": 500}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
