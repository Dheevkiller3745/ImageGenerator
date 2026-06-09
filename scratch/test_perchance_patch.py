import asyncio
import traceback
from playwright.async_api import async_playwright
from perchance.generator import Generator
from perchance import ImageGenerator

# Custom _start method to run in headed mode
async def custom_start(self):
    if not self._pw:
        self._pw = await async_playwright().start()
    if not self._browser:
        print("Launching headed browser...")
        # We can also add ignore_default_args to hide automation flags
        self._browser = await self._pw.chromium.launch(
            headless=False
        )
    if not self._context:
        self._context = await self._browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )

# Apply patch
Generator._start = custom_start

async def main():
    try:
        print("Starting patched ImageGenerator...")
        async with ImageGenerator() as gen:
            print("Generating...")
            result = await gen.image(
                prompt="a beautiful watercolor of a red cat",
                shape="square"
            )
            print("Success!")
            print("Image ID:", result.image_id)
            img_data = await result.download()
            print("Downloaded size:", len(img_data.getvalue()))
    except Exception as e:
        print("Error:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
