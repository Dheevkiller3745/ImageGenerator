import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/serverSupabaseClient';
import { supabaseAdmin } from '@/utils/supabaseClient';

function generateLocalGlassmorphicSvg(prompt: string, shape: string, seed: number): { imageUrl: string; w: number; h: number } {
  // Simple deterministic pseudorandom selection based on seed
  const width = shape === 'portrait' ? 512 : 768;
  const height = shape === 'landscape' ? 512 : 768;

  const palettes = [
    ["#7c4dff", "#ff4081", "#00bcd4"],
    ["#ff9800", "#ff4081", "#9c27b0"],
    ["#00e676", "#00b0ff", "#651fff"],
    ["#ff3d00", "#ffeb3b", "#00e5ff"],
    ["#7c4dff", "#00bcd4", "#3f51b5"]
  ];
  
  const paletteIdx = Math.abs(seed) % palettes.length;
  const colors = palettes[paletteIdx];

  const circles: string[] = [];
  const numCircles = 5;
  for (let i = 0; i < numCircles; i++) {
    // Generate pseudo-random coordinates and radiuses
    const cx = 100 + (Math.abs(seed + i * 149) % (width - 200));
    const cy = 100 + (Math.abs(seed - i * 263) % (height - 200));
    const radius = 120 + (Math.abs(seed * (i + 1)) % (Math.min(width, height) / 2 - 100));
    const color = colors[i % colors.length];
    const opacity = 0.3 + ((Math.abs(seed + i) % 10) / 30);
    circles.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" opacity="${opacity}" filter="url(#glow-blur)" />`);
  }

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#060608" />
      <stop offset="50%" stop-color="#0a0a0f" />
      <stop offset="100%" stop-color="#040406" />
    </linearGradient>
    <filter id="glow-blur">
      <feGaussianBlur stdDeviation="70" />
    </filter>
  </defs>
  
  <rect width="100%" height="100%" fill="url(#bg-grad)" />
  ${circles.join('\n  ')}
  
  <rect x="${width * 0.1}" y="${height * 0.1}" width="${width * 0.8}" height="${height * 0.8}" rx="24" fill="rgba(255, 255, 255, 0.01)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
  <text x="${width * 0.15}" y="${height * 0.85}" fill="rgba(255, 255, 255, 0.18)" font-family="monospace" font-size="10" letter-spacing="1">AETHER SEED: ${seed}</text>
  <text x="${width * 0.15}" y="${height * 0.82}" fill="rgba(124, 77, 255, 0.4)" font-family="sans-serif" font-weight="bold" font-size="12" letter-spacing="2">STATICs AI SYNTHESIS (FALLBACK)</text>
</svg>`;

  const base64Encoded = Buffer.from(svg).toString('base64');
  return {
    imageUrl: `data:image/svg+xml;base64,${base64Encoded}`,
    w: width,
    h: height
  };
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ detail: "Unauthorized access. Please log in first." }, { status: 401 });
    }

    const { prompt, negative_prompt, seed, shape } = await req.json();

    if (!prompt) {
      return NextResponse.json({ detail: "Prompt is required" }, { status: 400 });
    }

    const generatedSeed = seed !== undefined && seed !== -1 ? seed : Math.floor(Math.random() * 1000000);

    const resolutionMap: Record<string, { w: number; h: number }> = {
      square: { w: 768, h: 768 },
      portrait: { w: 512, h: 768 },
      landscape: { w: 768, h: 512 }
    };
    const { w, h } = resolutionMap[shape] || { w: 768, h: 768 };

    // Build Pollinations API endpoint URL
    const encodedPrompt = encodeURIComponent(prompt);
    let targetUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&seed=${generatedSeed}&nologo=true`;
    if (negative_prompt) {
      targetUrl += `&negative=${encodeURIComponent(negative_prompt)}`;
    }

    try {
      const resp = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Referer": "https://pollinations.ai/"
        },
        signal: AbortSignal.timeout(15000)
      });

      if (resp.status !== 200) {
        throw new Error(`Pollinations API returned status ${resp.status}`);
      }

      const buffer = await resp.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;

      // Write generation log to Supabase using admin client (bypasses RLS issues)
      try {
        await supabaseAdmin.from('generations_log').insert({
          user_id: user.id,
          prompt,
          seed: String(generatedSeed),
          engine: 'perchance',
          aspect_ratio: shape || 'square'
        });
      } catch (dbErr) {
        console.error("Failed to write generations telemetry log:", dbErr);
      }

      return NextResponse.json({
        status: "success",
        imageUrl: dataUrl,
        imageId: `img_${Math.floor(Math.random() * 900000) + 100000}`,
        seed: generatedSeed,
        prompt,
        shape,
        width: w,
        height: h
      });

    } catch (apiErr) {
      console.warn("Pollinations call failed, using glassmorphic fallback:", apiErr);
      const fallback = generateLocalGlassmorphicSvg(prompt, shape || 'square', generatedSeed);

      // Write generation log for fallback too
      try {
        await supabaseAdmin.from('generations_log').insert({
          user_id: user.id,
          prompt,
          seed: String(generatedSeed),
          engine: 'perchance',
          aspect_ratio: shape || 'square'
        });
      } catch (dbErr) {
        console.error("Failed to write generations telemetry log:", dbErr);
      }

      return NextResponse.json({
        status: "success",
        imageUrl: fallback.imageUrl,
        imageId: `local_${Math.floor(Math.random() * 900000) + 100000}`,
        seed: generatedSeed,
        prompt,
        shape,
        width: fallback.w,
        height: fallback.h
      });
    }

  } catch (error: any) {
    console.error("Perchance route exception:", error);
    return NextResponse.json({ detail: error.message || "Failed to generate image" }, { status: 500 });
  }
}
