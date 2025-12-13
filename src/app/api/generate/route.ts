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

  const styleDescriptor = `Style guide (JSON):
{
  "style_name": "High-Contrast Stencil Street Mural",
  "medium": "aerosol stencil street art mural",
  "color_palette": {
    "primary": ["matte black", "chalk white"],
    "secondary": ["cool gray"],
    "accent": {
      "color": "muted dark red",
      "usage": "very small, focal accent only"
    }
  },
  "contrast_and_tone": {
    "range": "very high contrast",
    "shading": "posterized, 2–4 tonal steps",
    "finish": "matte"
  },
  "line_and_edges": {
    "edge_quality": "hard stencil-cut edges",
    "artifacts": [
      "light aerosol overspray",
      "soft haloing",
      "occasional ragged stencil gaps",
      "minor paint drips and speckling"
    ]
  },
  "surface_and_environment": {
    "surface": "beige/tan stone or concrete wall",
    "texture_visibility": "wall texture faintly visible through paint",
    "details": [
      "rectangular wall panel seams",
      "urban grime and subtle staining",
      "darker grime band near ground level"
    ]
  },
  "composition": {
    "readability": "strong silhouette readability from distance",
    "layout": "bold central action with diagonal tension",
    "background": "no background elements beyond the wall",
    "negative_space": "large blank wall areas, especially above the mural"
  },
  "detail_treatment": {
    "highlights": "bold white graphic patches, not smooth gradients",
    "midtones": "used sparingly for volume in faces, hands, and fabric",
    "fine_detail": "simplified into stencil-friendly shapes"
  },
  "lighting_and_mood": {
    "lighting": "flat ambient daylight",
    "mood": "gritty, documentary, politically charged street art tone"
  },
  "framing": {
    "camera_angle": "straight-on, eye-level",
    "lens_feel": "slight wide-angle documentary photo",
    "crop": "no decorative border, mural fully visible"
  },
  "constraints": {
    "avoid": [
      "painterly brush strokes",
      "soft digital gradients",
      "glossy or 3D rendering",
      "neon or saturated colors",
      "studio or clean backgrounds",
      "anime or cartoon outlines",
      "watercolor textures",
      "hyper-detailed photoreal skin"
    ]
  }
}`;

  const promptWithStyle = `${styleDescriptor}\nDescription: Generate a new image with the same visual style, but showing: ${prompt}`;

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
