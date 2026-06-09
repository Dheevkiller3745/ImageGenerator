import asyncio
from perchance import ImageGenerator
import os

async def main():
    print("Initializing ImageGenerator...")
    async with ImageGenerator() as gen:
        print("Generating image...")
        result = await gen.image("a beautiful watercolor of a red cat sleeping on a windowsill", shape='landscape')
        print(f"Image generated! ID: {result.image_id}")
        
        # Save image
        out_dir = "scratch"
        os.makedirs(out_dir, exist_ok=True)
        filename = os.path.join(out_dir, "test_out.png")
        await result.save(filename)
        print(f"Saved to {filename}")

if __name__ == "__main__":
    asyncio.run(main())
