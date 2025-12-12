"use client";

import { useMemo, useState } from "react";

const samplePrompt =
  "A child reaching for a red heart-shaped balloon, stencil vibe, gritty alley wall.";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(
    () => prompt.trim().length > 0 && !isLoading,
    [prompt, isLoading],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message || "Something went wrong. Please try again.");
      }

      const { imageBase64: base64 } = (await response.json()) as {
        imageBase64?: string;
      };

      if (!base64) {
        throw new Error("No image was returned. Please try again.");
      }

      setImageBase64(base64);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSample = () => {
    setPrompt(samplePrompt);
    setMessage(null);
  };

  const imageSrc = useMemo(
    () => (imageBase64 ? `data:image/png;base64,${imageBase64}` : null),
    [imageBase64],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0c0f] via-[#111827] to-[#1f2937] text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-200/70">
            Banksy Studio
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Banksy-style image maker
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Create gritty, stencil-inspired art from your prompt using a fixed reference image and OpenAI image generation.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-200/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Stencil / street-art vibe
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Model: gpt-image-1
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Size: 1024 × 1024
            </span>
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm text-slate-200/80">
                  <span>Your prompt</span>
                  <button
                    type="button"
                    onClick={handleUseSample}
                    className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-100 transition hover:-translate-y-0.5 hover:border-fuchsia-300/60 hover:bg-fuchsia-500/20"
                  >
                    Use sample
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='Describe the scene you want in a Banksy style (e.g., "A child reaching for a red heart-shaped balloon").'
                  className="min-h-32 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none transition focus:border-fuchsia-400/70 focus:ring-2 focus:ring-fuchsia-400/30"
                />
              </label>

              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>
                  If a reference image path/URL is configured, the backend appends it quietly as guidance; otherwise it just sends your prompt.
                </span>
                {message && (
                  <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                    {message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-amber-400 px-6 py-3 text-base font-semibold text-black shadow-lg shadow-fuchsia-600/30 transition hover:scale-[1.01] hover:shadow-fuchsia-400/40 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Generating..." : "Generate Banksy-style image"}
              </button>
            </form>
          </section>

          <section className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span className="font-medium text-white">Output</span>
                {isLoading && (
                  <span className="animate-pulse text-xs text-fuchsia-100">
                    Generating with OpenAI...
                  </span>
                )}
              </div>
              <div className="mt-4 aspect-square overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/30">
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc}
                    alt="Banksy style output"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Your generated image will appear here.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-slate-300">
              <p className="font-medium text-white">How it works</p>
              <ul className="mt-2 space-y-1 text-slate-300/90">
                <li>Uses OpenAI gpt-image-1; if a reference is set, the backend includes its URL in the prompt as guidance.</li>
                <li>Everything runs in a single Next.js app; the Docker image serves both API and static assets.</li>
                <li>Requires an `OPENAI_API_KEY` at deploy time to call the OpenAI image endpoint.</li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
