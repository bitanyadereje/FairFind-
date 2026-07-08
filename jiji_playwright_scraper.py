from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from playwright.sync_api import sync_playwright
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
)

def fetch_html(url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle", timeout=30000)
        html = page.content()
        browser.close()
        return html

@app.get("/scrape")
async def scrape(category: str):
    url = f"https://jiji.et/{category}"
    try:
        html = await asyncio.to_thread(fetch_html, url)
        return {"html": html, "status": 200}
    except Exception as e:
        return {"error": str(e), "status": 500}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)