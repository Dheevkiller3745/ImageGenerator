import asyncio
from playwright.async_api import async_playwright
import random

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        url = f"https://image-generation.perchance.org/api/verifyUser?thread=0&__cacheBust={random.random()}"
        print(f"Navigating to {url}...")
        await page.goto(url)
        
        # Wait a bit in case of scripts running
        await asyncio.sleep(3)
        
        content = await page.content()
        print("Page content length:", len(content))
        
        # Write to file
        with open("scratch/page_content.html", "w", encoding="utf-8") as f:
            f.write(content)
        print("Saved to scratch/page_content.html")
        
        # Screenshot to see if there is a captcha
        await page.screenshot(path="scratch/screenshot.png")
        print("Saved screenshot to scratch/screenshot.png")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
