import asyncio
import httpx

async def main():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://pollinations.ai/",
        "Origin": "https://pollinations.ai"
    }
    url = "https://image.pollinations.ai/prompt/a%20beautiful%20watercolor%20of%20a%20red%20cat?width=768&height=768&seed=12345&nologo=true"
    
    print("Fetching image with browser headers...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(url, headers=headers)
            print("Status Code:", resp.status_code)
            if resp.status_code == 200:
                print("Success! Downloaded size:", len(resp.content))
            else:
                print("Failed. Response text snippet:", resp.text[:200])
        except Exception as e:
            print("Error:", str(e))

if __name__ == "__main__":
    asyncio.run(main())
