import { DiffViewer } from '@/components/DiffViewer';
import { MarkdownToggle } from '@/components/MarkdownToggle';
import { PostingGuide } from '@/components/PostingGuide';

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
+  it("does not overwrite nonzero cache fields already present on the session entry", async () => {
+    await withTempHome(
+      async (dir) => {
+        const sessionId = "sess-cache-precedence";
+        writeBaselineTranscriptUsageLog({
+          dir,
+          agentId: "main",
+          sessionId,
+        });
+
+        const text = buildTranscriptStatusText({
+          sessionId,
+          sessionKey: "agent:main:main",
+          sessionEntry: {
+            cacheRead: 250,
+            cacheWrite: 50,
+          },
+        });
+
+        const normalized = normalizeTestText(text);
+        expect(normalized).toContain("250 cached");
+        expect(normalized).not.toContain("1.0k cached");
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
[test-parallel] start base workers=1 filters=1
✓ src/auto-reply/status.test.ts (47 tests passed)
Duration ~17.0s wall clock on local clean clone
`;

const prDraft = String.raw`## Summary
- Problem: /status transcript fallback restored token counts and model data, but dropped cacheRead/cacheWrite.
- Why it matters: cache usage could disappear from status output even when it still existed in transcript usage data.
- What changed: transcript fallback now carries cacheRead/cacheWrite and restores them when current session-entry values are absent/zero.
- What did NOT change: provider usage normalization, live usage collection, and broader precedence rules remain unchanged.

AI-assisted: yes; author reviewed and verified the final code, tests, and PR framing.

## Change Type (select all)
- [x] Bug fix
- [ ] Feature
- [ ] Refactor required for the fix
- [ ] Docs
- [ ] Security hardening
- [ ] Chore/infra

## Scope (select all touched areas)
- [ ] Gateway / orchestration
- [ ] Skills / tool execution
- [ ] Auth / tokens
- [ ] Memory / storage
- [ ] Integrations
- [ ] API / contracts
- [x] UI / DX
- [ ] CI/CD / infra

## Linked Issue/PR
- Closes #58522
- Related: none
- [x] This PR fixes a bug or regression

## Root Cause / Regression History (if applicable)
- Root cause: readUsageFromSessionLog() returned only input/output/promptTokens/total/model, so cacheRead/cacheWrite were unavailable to buildStatusMessage() during transcript fallback.
- Missing detection / guardrail: no regression covered cache usage survival in the transcript fallback path.
- Prior context (git blame, prior PR, issue, or refactor if known): status code already used transcript fallback for other usage fields; cache fields were omitted from the returned shape.
- Why this regressed now: unknown; this appears to be a pre-existing gap rather than a regression introduced in this branch.
- If unknown, what was ruled out: provider normalization and cache formatting paths already supported cache usage correctly.

## Regression Test Plan (if applicable)
- Coverage level that should have caught this:
  - [ ] Unit test
  - [x] Seam / integration test
  - [ ] End-to-end test
  - [ ] Existing coverage already sufficient
- Target test or file: src/auto-reply/status.test.ts
- Scenario the test should lock in: transcript fallback restores cache usage when session-entry cache fields are absent, and does not overwrite existing nonzero session-entry cache values.
- Why this is the smallest reliable guardrail: the bug is in the status assembly path, so a focused seam/integration test is enough without needing a live provider session.
- Existing test that already covers this (if any): none for cache fallback before this change.
- If no new test is added, why not: N/A

## User-visible / Behavior Changes
- /status can now show cache usage correctly when the response relies on transcript fallback and cache fields are present there but absent in the live session entry.

## Diagram (if applicable)
N/A

## Security Impact (required)
- New permissions/capabilities? (No)
- Secrets/tokens handling changed? (No)
- New/changed network calls? (No)
- Command/tool execution surface changed? (No)
- Data access scope changed? (No)
- If any Yes, explain risk + mitigation: N/A

## Repro + Verification
### Environment
- OS: macOS
- Runtime/container: local clean clone
- Model/provider: N/A for targeted regression
- Integration/channel (if any): N/A
- Relevant config (redacted): transcript-backed status test fixtures

### Steps
1. Run \`pnpm test -- src/auto-reply/status.test.ts\`
2. Inspect the regression cases covering transcript cache fallback and precedence.
3. Optionally reproduce a status path where transcript usage exists but live session entry cache fields are incomplete.

### Expected
- Cache usage appears when transcript fallback is used.
- Existing nonzero session-entry cache fields are preserved.

### Actual
- Matches expected after the fix.

## Evidence
- [ ] Failing test/log before + passing after
- [x] Trace/log snippets
- [ ] Screenshot/recording
- [ ] Perf numbers (if relevant)

## Human Verification (required)
What you personally verified (not just CI), and how:
- Verified scenarios: targeted status test file passes; transcript fallback restores cache usage; precedence regression preserves existing session-entry cache values.
- Edge cases checked: missing cache fields vs existing nonzero cache fields.
- What you did **not** verify: full live gateway manual repro against a real provider session.

## Review Conversations
- [ ] I replied to or resolved every bot review conversation I addressed in this PR.
- [ ] I left unresolved only the conversations that still need reviewer or maintainer judgment.

## Compatibility / Migration
- Backward compatible? (Yes)
- Config/env changes? (No)
- Migration needed? (No)
- If yes, exact upgrade steps: N/A

## Risks and Mitigations
- Risk: transcript fallback could accidentally become an implicit precedence rewrite.
  - Mitigation: explicit regression added to prove nonzero session-entry cache fields are not overwritten.
- Risk: status output still depends on transcript parsing limits for old sessions.
  - Mitigation: patch is intentionally narrow and does not expand transcript parsing behavior beyond existing fallback logic.`;

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
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1">commit: 00c75682ae</span>
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1">status: ready after review pass</span>
          </div>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[#3b3128]">
            Root cause confirmed in source: transcript fallback populated input/output/prompt/total/model, but silently dropped cacheRead/cacheWrite.
            A staff-style review asked for one extra precedence regression before shipping; that follow-up test is now added and passing.
          </p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Review verdict</div>
            <ul className="mt-3 space-y-2 text-[15px] leading-7 text-[#3b3128]">
              <li>• Independent review verdict: <strong>patch first</strong>, then ship.</li>
              <li>• Requested follow-up was a precedence regression proving transcript fallback does not overwrite existing nonzero cache fields.</li>
              <li>• That follow-up test is now added and passing.</li>
              <li>• What I did <strong>not</strong> verify: a full live gateway repro against a real provider-backed session.</li>
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
              110 lines in patch
            </span>
          </div>
          <div className="mt-4">
            <DiffViewer diff={diffText} />
          </div>
        </section>

        <section className="mt-8 rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Test output summary</div>
          <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#5b4f44]">
            Smallest reliable guardrail: this bug lives in the status assembly path, so a focused seam/integration test is enough without needing a live provider session.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-[1.2rem] bg-[#20160f] p-5 text-[12px] leading-6 text-[#f7efe6]">{testOutput}</pre>
        </section>

        <section className="mt-8 rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Before / after</div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.2rem] border border-[#e4d8ca] bg-[#fcf8f1] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b7158]">Before</div>
              <p className="mt-2 text-[14px] leading-6 text-[#3b3128]">
                Status could restore token counts from transcript fallback, but the cache line could still disappear because cacheRead/cacheWrite were dropped before formatting.
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-[#e4d8ca] bg-[#fcf8f1] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b7158]">After</div>
              <p className="mt-2 text-[14px] leading-6 text-[#3b3128]">
                Transcript fallback now carries cacheRead/cacheWrite too, so the cache line survives when transcript data is the only complete usage source.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Suggested PR draft</div>
          <div className="mt-4">
            <MarkdownToggle markdown={prDraft} />
          </div>
        </section>

        <PostingGuide branch="stuart/issue-58522-cache-status" verifyCommand="pnpm test -- src/auto-reply/status.test.ts" issueNumber="#58522" />

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
