import { DiffViewer } from '@/components/DiffViewer';

const diffText = String.raw`diff --git a/src/auto-reply/status.test.ts b/src/auto-reply/status.test.ts
index 48979ceba6..09fb664f8c 100644
--- a/src/auto-reply/status.test.ts
+++ b/src/auto-reply/status.test.ts
@@ -998,6 +998,29 @@ describe("buildStatusMessage", () => {
     );
   });
 
+  it("hydrates cache usage from transcript fallback when session entry omits cache fields", async () => {
+    await withTempHome(
+      async (dir) => {
+        const sessionId = "sess-cache-fallback";
+        writeBaselineTranscriptUsageLog({
+          dir,
+          agentId: "main",
+          sessionId,
+        });
+
+        const text = buildTranscriptStatusText({
+          sessionId,
+          sessionKey: "agent:main:main",
+        });
+
+        const normalized = normalizeTestText(text);
+        expect(normalized).toContain("Cache: 100% hit");
+        expect(normalized).toContain("1.0k cached");
+      },
+      { prefix: "openclaw-status-" },
+    );
+  });
+
   it("reads transcript usage for non-default agents", async () => {
     await withTempHome(
       async (dir) => {
diff --git a/src/auto-reply/status.ts b/src/auto-reply/status.ts
index 256efc6ebe..224d15bfb5 100644
--- a/src/auto-reply/status.ts
+++ b/src/auto-reply/status.ts
@@ -242,6 +242,8 @@ const readUsageFromSessionLog = (
       output: number;
       promptTokens: number;
       total: number;
+      cacheRead?: number;
+      cacheWrite?: number;
       model?: string;
     }
   | undefined => {
@@ -320,7 +322,15 @@ const readUsageFromSessionLog = (
     if (promptTokens === 0 && total === 0) {
       return undefined;
     }
-    return { input, output, promptTokens, total, model };
+    return {
+      input,
+      output,
+      promptTokens,
+      total,
+      cacheRead: lastUsage.cacheRead,
+      cacheWrite: lastUsage.cacheWrite,
+      model,
+    };
   } catch {
     return undefined;
   }
@@ -553,6 +563,12 @@ export function buildStatusMessage(args: StatusArgs): string {
       if (!outputTokens || outputTokens === 0) {
         outputTokens = logUsage.output;
       }
+      if ((cacheRead == null || cacheRead === 0) && typeof logUsage.cacheRead === "number") {
+        cacheRead = logUsage.cacheRead;
+      }
+      if ((cacheWrite == null || cacheWrite === 0) && typeof logUsage.cacheWrite === "number") {
+        cacheWrite = logUsage.cacheWrite;
+      }
     }
   }
`;

const testOutput = String.raw`$ pnpm test -- src/auto-reply/status.test.ts
[test-parallel] start unit workers=2 filters=1
✓ src/auto-reply/status.test.ts (targeted file passed)
Duration ~16.6s wall clock on local clean clone
`;

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f4eee7] text-[#20160f]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <a href="/" className="text-sm font-semibold text-[#8b7158] underline underline-offset-4">
          ← Back to dossier
        </a>
        <header className="mt-4 rounded-[2rem] border border-[#d7cdbf] bg-[#fffdf8] p-8 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b866d]">Implementation detail page</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#20160f]">#58522 · session_status cache usage transcript fallback</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#6c6258]">
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1">branch: stuart/issue-58522-cache-status</span>
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1">commit: 93f2ece62a</span>
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1">status: reviewable</span>
          </div>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[#3b3128]">
            Root cause confirmed in source: transcript fallback populated input/output/prompt/total/model, but silently dropped cacheRead/cacheWrite.
            The fix keeps scope narrow by extending only the transcript-fallback plumbing and adding one regression that proves cache lines now render.
          </p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Verification</div>
            <ul className="mt-3 space-y-2 text-[15px] leading-7 text-[#3b3128]">
              <li>• Targeted test file passes in the clean clone.</li>
              <li>• No behavior change outside transcript fallback hydration path.</li>
              <li>• Overlap scan did not reveal an open PR directly solving this same transcript-fallback bug.</li>
            </ul>
          </div>
          <div className="rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Overlap scan summary</div>
            <p className="mt-3 text-[15px] leading-7 text-[#3b3128]">
              There is adjacent status/cache work in the repo, including a draft PR about cache tokens in status cost estimates, but nothing I found directly duplicates this
              fix: hydrating cacheRead/cacheWrite from transcript fallback when the live session entry omits them.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Rendered diff</div>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#5b4f44]">
                GitHub-style rendering with typed line treatment so it is easier to scan what actually changed versus surrounding context.
              </p>
            </div>
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c6258]">
              77 lines in patch
            </span>
          </div>
          <div className="mt-4">
            <DiffViewer diff={diffText} />
          </div>
        </section>

        <section className="mt-8 rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Test output summary</div>
          <pre className="mt-4 overflow-x-auto rounded-[1.2rem] bg-[#20160f] p-5 text-[12px] leading-6 text-[#f7efe6]">{testOutput}</pre>
        </section>

        <section className="mt-8 rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Suggested PR draft</div>
          <pre className="mt-4 overflow-x-auto rounded-[1.2rem] bg-[#20160f] p-5 text-[12px] leading-6 text-[#f7efe6]">{String.raw`## Summary
Fix session_status so transcript usage fallback also restores cacheRead/cacheWrite when the live session entry omits those fields.

## Problem
/session_status could fall back to transcript usage for input/output/prompt/total/model, but it did not carry over cacheRead/cacheWrite from the transcript record. That meant cache usage was missing from status output even when the provider had returned cache usage data and the transcript log still had it.

## Root cause
readUsageFromSessionLog() returned only input/output/promptTokens/total/model. buildStatusMessage() then used that transcript fallback to hydrate token counts, but never had cacheRead/cacheWrite available to restore.

## What changed
- extend readUsageFromSessionLog() to return cacheRead/cacheWrite
- hydrate cacheRead/cacheWrite from transcript fallback in buildStatusMessage() when current values are missing/zero
- add a focused regression test proving cache usage now appears from transcript fallback

## What did not change
- no changes to provider usage normalization
- no changes to live session usage collection
- no changes to status formatting beyond making already-available cache usage survive transcript fallback

## Test plan
- pnpm test -- src/auto-reply/status.test.ts
- verified targeted regression covering transcript fallback cache hydration passes in clean clone

## Human verification
- reproduce a status path that relies on transcript usage fallback
- confirm cache line now renders instead of disappearing when only transcript retains cacheRead/cacheWrite

## Risk / mitigation
Low risk. The patch is limited to transcript fallback plumbing in status assembly and covered by a focused regression test.`}</pre>
        </section>

        <details className="mt-8 rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Original bug context</summary>
          <div className="mt-4 text-[15px] leading-7 text-[#3b3128]">
            <p>
              The original issue reported that <code>/session_status</code> was not showing cache-hit tokens even though the provider had returned cache usage data.
              The useful clue was that other usage fields could still appear via transcript fallback, implying the data was present somewhere in the pipeline but not making it through the status assembly path.
            </p>
            <p className="mt-3">
              This implementation takes the narrowest interpretation of that report: keep the existing fallback design, but make sure cacheRead/cacheWrite are treated like the other usage fields already restored from transcript logs.
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
