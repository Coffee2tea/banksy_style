import { NextResponse } from "next/server";
import OpenAI from "openai";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ReferenceSource =
  | { image: Buffer }
  | { image_url: string };

function loadReferenceImage(): ReferenceSource {
  const imageUrl = process.env.REFERENCE_IMAGE_URL;
  if (imageUrl) return { image_url: imageUrl };

  const base64 = process.env.REFERENCE_IMAGE_BASE64;
  if (base64) return { image: Buffer.from(base64, "base64") };

  const filePath = process.env.REFERENCE_IMAGE_PATH;
  if (filePath) {
    const absolute = resolve(filePath);
    return { image: readFileSync(absolute) };
  }

  const referenceDir = resolve("public", "reference");
  try {
    const firstFile = readdirSync(referenceDir).find((name) => {
      const fullPath = resolve(referenceDir, name);
      return statSync(fullPath).isFile();
    });
    if (firstFile) {
      return { image: readFileSync(resolve(referenceDir, firstFile)) };
    }
  } catch {
    // ignore and fall through to error throw
  }

  throw new Error(
    "Reference image missing. Place an image in public/reference or set REFERENCE_IMAGE_URL, REFERENCE_IMAGE_BASE64, or REFERENCE_IMAGE_PATH.",
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const prompt: string = (body?.prompt || "").trim();

  if (!prompt) {
    return NextResponse.json(
      { message: "Prompt is required." },
      { status: 400 },
    );
  }

  const promptWithStyle = `Banksy style. ${prompt}`;

  let reference: ReferenceSource;
  try {
    reference = loadReferenceImage();
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Reference image unavailable." },
      { status: 500 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { message: "OPENAI_API_KEY is missing." },
      { status: 500 },
    );
  }

  try {
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: promptWithStyle,
      size: "1024x1024",
      ...reference,
    });

    const imageBase64 = result.data[0]?.b64_json;
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
