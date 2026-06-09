import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        # We go to the main perchance.org page first to get cookies/session if needed
        print("Going to perchance.org...")
        await page.goto("https://perchance.org")
        await asyncio.sleep(2)
        
        # Now go to the plugin page
        url = "https://perchance.org/text-to-image-plugin"
        print(f"Navigating to {url}...")
        await page.goto(url)
        await asyncio.sleep(5)
        
        content = await page.content()
        print("Page content length:", len(content))
        
        # Save HTML
        with open("scratch/plugin_source.html", "w", encoding="utf-8") as f:
            f.write(content)
        print("Saved to scratch/plugin_source.html")
        
        # Take a screenshot to verify what it displays
        await page.screenshot(path="scratch/plugin_screenshot.png")
        print("Saved screenshot to scratch/plugin_screenshot.png")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
