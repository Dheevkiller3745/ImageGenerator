import asyncio
import traceback

async def main():
    try:
        from perchance import ImageGenerator
        print("Imported perchance successfully.")
        async with ImageGenerator() as gen:
            print("Instantiated ImageGenerator. Generating...")
            result = await gen.image(
                prompt="a beautiful watercolor of a red cat",
                shape="square"
            )
            print("Generated successfully!")
            print("Image ID:", result.image_id)
            print("Seed:", result.seed)
            img_data = await result.download()
            print("Downloaded successfully! Size:", len(img_data.getvalue()))
    except Exception as e:
        print("An error occurred:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
