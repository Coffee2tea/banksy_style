import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const prompt: string = (body?.prompt || "").trim();

  if (!prompt) {
    return NextResponse.json(
      { message: "Prompt is required." },
      { status: 400 },
    );
  }

  const rawReference =
    process.env.REFERENCE_IMAGE_URL || process.env.REFERENCE_IMAGE_PATH;

  // Build a public URL for the reference image (if provided) and inject only in the backend prompt.
  const host = req.headers.get("host") || "localhost";
  const baseUrl = `https://${host}`;
  const referenceUrl = rawReference
    ? rawReference.startsWith("http")
      ? rawReference
      : `${baseUrl}/${rawReference.replace(/^public\\/?/, "")}`
    : null;

  const promptWithStyle = referenceUrl
    ? `Banksy style. Use this reference image for inspiration: ${referenceUrl}. ${prompt}`
    : `Banksy style. ${prompt}`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "OPENAI_API_KEY is missing." },
      { status: 500 },
    );
  }

  try {
    const openai = new OpenAI({ apiKey });

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: promptWithStyle,
      size: "1024x1024",
    });

    const imageBase64 = result.data?.[0]?.b64_json;
    if (!imageBase64) {
      throw new Error("No image returned from model.");
    }

    return NextResponse.json({ imageBase64 });
  } catch (error) {
    console.error("Image generation failed", error);
    return NextResponse.json(
      { message: "Image generation failed. Please try again." },
      { status: 500 },
    );
  }
}
