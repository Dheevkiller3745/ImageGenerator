import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=True) # Let's see what headless gets
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        url = "https://image-generation.perchance.org/api/verifyUser?thread=0"
        print(f"Navigating to {url}...")
        await page.goto(url)
        
        print("Waiting 10 seconds for Turnstile...")
        await asyncio.sleep(10)
        
        content = await page.content()
        print("Page Content snippet:")
        print(content[:1000])
        print("..." if len(content) > 1000 else "")
        
        # Save screenshot
        screenshot_path = "scratch/perchance_debug.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
