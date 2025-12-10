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
        throw new Error(errorBody?.message || "生成失败，请重试。");
      }

      const { imageBase64: base64 } = (await response.json()) as {
        imageBase64?: string;
      };

      if (!base64) {
        throw new Error("未收到图片内容，请稍后再试。");
      }

      setImageBase64(base64);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "生成失败，请重试。");
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
            生成 Banksy 风格的图像
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            输入一句描述，后端会带上我们提供的参考图调用 OpenAI 图像模型。
            点击生成后，稍等片刻即可看到结果。
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-200/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              固定参考图（后台注入）
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              模型：gpt-image-1
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              输出：1024 × 1024
            </span>
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm text-slate-200/80">
                  <span>提示词</span>
                  <button
                    type="button"
                    onClick={handleUseSample}
                    className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-100 transition hover:-translate-y-0.5 hover:border-fuchsia-300/60 hover:bg-fuchsia-500/20"
                  >
                    使用示例
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想要的场景，例如：雨夜街头的涂鸦墙，出现一只拿着喷漆罐的狐狸。"
                  className="min-h-32 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none transition focus:border-fuchsia-400/70 focus:ring-2 focus:ring-fuchsia-400/30"
                />
              </label>

              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>
                  提示词自动加上 Banksy 风格，会套用后台参考图增强一致性。
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
                {isLoading ? "生成中…" : "生成 Banksy 风格图片"}
              </button>
            </form>
          </section>

          <section className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span className="font-medium text-white">生成结果</span>
                {isLoading && (
                  <span className="animate-pulse text-xs text-fuchsia-100">
                    正在请求 OpenAI…
                  </span>
                )}
              </div>
              <div className="mt-4 aspect-square overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/30">
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc}
                    alt="生成结果"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    生成的图片会显示在这里
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-slate-300">
              <p className="font-medium text-white">使用说明</p>
              <ul className="mt-2 space-y-1 text-slate-300/90">
                <li>· 后端会在请求中自动加入固定参考图片，无需用户上传。</li>
                <li>· 可以多次尝试不同描述，找到喜欢的构图与元素。</li>
                <li>· 若频繁失败，请检查环境变量中的参考图和 API Key。</li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
