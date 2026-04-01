"use client";

import { useMemo, useState } from "react";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderMarkdown(md: string) {
  let html = escapeHtml(md);

  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="mt-5 text-lg font-semibold tracking-[-0.02em] text-[#20160f]">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="mt-6 text-xl font-semibold tracking-[-0.03em] text-[#20160f]">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#20160f]">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#20160f]">$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-[#f3ece3] px-1.5 py-0.5 font-mono text-[0.92em] text-[#5b4f44]">$1</code>');

  const lines = html.split("\n");
  const out: string[] = [];
  let inList = false;

  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      if (!inList) {
        out.push('<ul class="mt-3 space-y-2 pl-5 text-[14px] leading-7 text-[#3b3128] list-disc">');
        inList = true;
      }
      out.push(`<li>${line.replace(/^\s*-\s+/, "")}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (!line.trim()) {
      out.push('<div class="h-2"></div>');
      continue;
    }
    if (line.startsWith("<h")) {
      out.push(line);
      continue;
    }
    out.push(`<p class="text-[14px] leading-7 text-[#3b3128]">${line}</p>`);
  }
  if (inList) {
    out.push("</ul>");
  }
  return out.join("\n");
}

export function MarkdownToggle({ markdown }: { markdown: string }) {
  const [mode, setMode] = useState<"rendered" | "raw">("rendered");
  const rendered = useMemo(() => renderMarkdown(markdown), [markdown]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("rendered")}
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
            mode === "rendered"
              ? "border-[#20160f] bg-[#20160f] text-[#fffdf8]"
              : "border-[#d8d0c4] bg-[#f7f2eb] text-[#6c6258]"
          }`}
        >
          Rendered
        </button>
        <button
          type="button"
          onClick={() => setMode("raw")}
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
            mode === "raw"
              ? "border-[#20160f] bg-[#20160f] text-[#fffdf8]"
              : "border-[#d8d0c4] bg-[#f7f2eb] text-[#6c6258]"
          }`}
        >
          Raw
        </button>
      </div>

      {mode === "rendered" ? (
        <div
          className="mt-4 rounded-[1.2rem] border border-[#e4d8ca] bg-[#fcf8f1] p-5"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      ) : (
        <pre className="mt-4 overflow-x-auto rounded-[1.2rem] bg-[#20160f] p-5 text-[12px] leading-6 text-[#f7efe6]">
          {markdown}
        </pre>
      )}
    </div>
  );
}
