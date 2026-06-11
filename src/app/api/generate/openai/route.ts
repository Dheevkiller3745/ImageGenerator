import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@/utils/serverSupabaseClient';
import { supabaseAdmin } from '@/utils/supabaseClient';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ detail: "Unauthorized access. Please log in first." }, { status: 401 });
    }

    const { prompt, size } = await req.json();

    if (!prompt) {
      return NextResponse.json({ detail: "Prompt is required" }, { status: 400 });
    }
    
    // Default size mapping matching previous logic
    let dimensions = "1024x1024";
    if (size === 'portrait') dimensions = "1024x1792";
    if (size === 'landscape') dimensions = "1792x1024";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { detail: "OPENAI_API_KEY is missing. Please set it in your .env file to use the Real API." },
        { status: 500 }
      );
    }

    // Generate image
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: dimensions as '1024x1024' | '1024x1792' | '1792x1024',
      response_format: "b64_json",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("No image data returned from OpenAI");
    }

    const dataUrl = `data:image/png;base64,${b64}`;

    // 2. Insert into generations_log table using service role client, attributing it to user
    try {
      await supabaseAdmin.from('generations_log').insert({
        user_id: user.id,
        prompt: prompt,
        seed: "1", // DALL-E 3 default seed representation
        engine: "openai",
        aspect_ratio: size || "square"
      });
    } catch (dbErr) {
      console.error("Failed to write generations telemetry log:", dbErr);
    }

    return NextResponse.json({
      status: "success",
      imageUrl: dataUrl,
      prompt: prompt,
      shape: size,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("OpenAI Generation Error:", error);
    return NextResponse.json({ detail: error.message || "Failed to generate image via OpenAI" }, { status: 500 });
  }
}
