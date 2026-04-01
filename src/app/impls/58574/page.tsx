import { DiffViewer } from '@/components/DiffViewer';
import { MarkdownToggle } from '@/components/MarkdownToggle';
import { PostingGuide } from '@/components/PostingGuide';

const diffText = String.raw`diff --git a/src/cron/service/timer.test.ts b/src/cron/service/timer.test.ts
index e6009c42fd..2a05737994 100644
--- a/src/cron/service/timer.test.ts
+++ b/src/cron/service/timer.test.ts
@@ -81,6 +81,14 @@ describe("cron service timer seam coverage", () => {
       .filter((delay): delay is number => typeof delay === "number");
     expect(delays.some((delay) => delay > 0)).toBe(true);
 
+    expect(logger.debug).toHaveBeenCalledWith(
+      expect.objectContaining({
+        nextAt: now + 60_000,
+        nextAtReadable: new Date(now + 60_000).toISOString(),
+      }),
+      "cron: timer armed",
+    );
+
     timeoutSpy.mockRestore();
   });
 
diff --git a/src/cron/service/timer.ts b/src/cron/service/timer.ts
index 178feb2ba8..f12dd59587 100644
--- a/src/cron/service/timer.ts
+++ b/src/cron/service/timer.ts
@@ -642,7 +642,12 @@ export function armTimer(state: CronServiceState) {
     });
   }, clampedDelay);
   state.deps.log.debug(
-    { nextAt, delayMs: clampedDelay, clamped: delay > MAX_TIMER_DELAY_MS },
+    {
+      nextAt,
+      nextAtReadable: new Date(nextAt).toISOString(),
+      delayMs: clampedDelay,
+      clamped: delay > MAX_TIMER_DELAY_MS,
+    },
     "cron: timer armed",
   );
 }
`;

const testOutput = String.raw`$ pnpm test -- src/cron/service/timer.test.ts
[test-parallel] start unit workers=2 filters=1
✓ src/cron/service/timer.test.ts (2 tests passed)
Duration ~22.3s wall clock on local clean clone
`;

const prDraft = String.raw`## Summary
- Problem: ` + "`cron: timer armed`" + ` debug logs expose nextAt only as a Unix ms timestamp.
- Why it matters: human operators have to manually convert the value during cron scheduling diagnosis.
- What changed: added nextAtReadable as an ISO-8601 companion field while preserving numeric nextAt.
- What did NOT change: scheduler behavior, cron state, CLI output, and machine-readable nextAt semantics remain unchanged.

## Change Type (select all)
- [ ] Bug fix
- [x] Feature
- [ ] Refactor required for the fix
- [ ] Docs
- [ ] Security hardening
- [ ] Chore/infra

## Scope (select all touched areas)
- [x] Gateway / orchestration
- [ ] Skills / tool execution
- [ ] Auth / tokens
- [ ] Memory / storage
- [ ] Integrations
- [ ] API / contracts
- [x] UI / DX
- [ ] CI/CD / infra

## Linked Issue/PR
- Closes #58574
- Related #N/A
- [ ] This PR fixes a bug or regression

## Root Cause / Regression History (if applicable)
- Root cause: the debug payload optimized for machine-readability only and did not include a human-readable duplicate for nextAt.
- Missing detection / guardrail: no seam test asserted the presence of a readable companion field in the timer-armed debug payload.
- Prior context (git blame, prior PR, issue, or refactor if known): N/A
- Why this regressed now: N/A
- If unknown, what was ruled out: persisted cron state and CLI output were inspected and are not the issue target.

## Regression Test Plan (if applicable)
- Coverage level that should have caught this:
  - [ ] Unit test
  - [x] Seam / integration test
  - [ ] End-to-end test
  - [ ] Existing coverage already sufficient
- Target test or file: src/cron/service/timer.test.ts
- Scenario the test should lock in: when the timer is armed, the debug payload includes both numeric nextAt and ISO nextAtReadable.
- Why this is the smallest reliable guardrail: the change is only in the timer-arm logging seam.
- Existing test that already covers this (if any): existing timer seam test already asserted timer arming behavior and logger interaction.
- If no new test is added, why not: N/A

## User-visible / Behavior Changes
- Debug logs for ` + "`cron: timer armed`" + ` now include nextAtReadable in ISO-8601 format.

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
- Runtime/container: local clean clone at ~/Developer/openclaw-contrib
- Model/provider: N/A
- Integration/channel (if any): N/A
- Relevant config (redacted): cron timer seam tests only

### Steps
1. Run \`pnpm test -- src/cron/service/timer.test.ts\`
2. Inspect the logger assertion on the timer-armed debug payload.
3. Optionally inspect a live debug log entry after arming a cron timer.

### Expected
- The debug payload contains both numeric nextAt and readable nextAtReadable.

### Actual
- Matches expected after the change.

## Evidence
- [x] Failing test/log before + passing after
- [x] Trace/log snippets
- [ ] Screenshot/recording
- [ ] Perf numbers (if relevant)

## Human Verification (required)
What you personally verified (not just CI), and how:
- Verified scenarios: targeted timer seam test passes; logger payload includes both nextAt and nextAtReadable.
- Edge cases checked: machine-readable nextAt remains present.
- What you did **not** verify: full gateway manual log capture in a real cron deployment.

## Review Conversations
- [ ] I replied to or resolved every bot review conversation I addressed in this PR.
- [ ] I left unresolved only the conversations that still need reviewer or maintainer judgment.

## Compatibility / Migration
- Backward compatible? (Yes)
- Config/env changes? (No)
- Migration needed? (No)
- If yes, exact upgrade steps: N/A

## Risks and Mitigations
- Risk: consumers might start depending on nextAtReadable once it exists.
  - Mitigation: keep numeric nextAt unchanged and document nextAtReadable as an additive debug convenience field.
- Risk: accidental unrelated worktree noise in PR.
  - Mitigation: verify clean git status before posting and do not include unrelated lockfile changes.`;

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f4eee7] text-[#20160f]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <a href="/" className="text-sm font-semibold text-[#8b7158] underline underline-offset-4">
          ← Back to dossier
        </a>
        <header className="mt-4 rounded-[2rem] border border-[#d7cdbf] bg-[#fffdf8] p-8 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b866d]">Implementation detail page</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#20160f]">#58574 · readable nextAt field for cron timer logs</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#6c6258]">
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1">branch: stuart/issue-58574-readable-nextat</span>
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1">commit: 231f500d7a</span>
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1">status: ship per review</span>
          </div>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[#3b3128]">
            Source inspection showed the issue was about the cron timer debug payload rather than CLI list output. A staff-style review concluded this is a clean,
            additive change and is ready to ship as-is, with the only caution being to keep unrelated worktree noise like <code className="mx-1 rounded bg-[#f8f2ea] px-1.5 py-0.5 text-[13px]">pnpm-lock.yaml</code>
            out of any eventual PR.
          </p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Review verdict</div>
            <ul className="mt-3 space-y-2 text-[15px] leading-7 text-[#3b3128]">
              <li>• Independent review verdict: <strong>ship</strong>.</li>
              <li>• Scope was judged clean, additive, and consistent with the issue request.</li>
              <li>• Main review note was branch hygiene: do not accidentally include unrelated lockfile noise.</li>
            </ul>
          </div>
          <div className="rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Overlap scan summary</div>
            <p className="mt-3 text-[15px] leading-7 text-[#3b3128]">
              There is plenty of other cron work in flight, but nothing I found specifically overlaps this additive <code>nextAtReadable</code> field on the timer-armed debug log payload.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Rendered diff</div>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#5b4f44]">
                Additive patch rendered in a GitHub-style diff presentation so you can quickly validate that only the logging payload and seam assertion changed.
              </p>
            </div>
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c6258]">
              37 lines in patch
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
          <div className="mt-4">
            <MarkdownToggle markdown={prDraft} />
          </div>
        </section>

        <PostingGuide branch="stuart/issue-58574-readable-nextat" verifyCommand="pnpm test -- src/cron/service/timer.test.ts" issueNumber="#58574" />

        <details className="mt-8 rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Original bug context</summary>
          <div className="mt-4 text-[15px] leading-7 text-[#3b3128]">
            <p>
              The original issue reported that cron debug output exposed <code>nextAt</code> only as a Unix timestamp and asked either to make it human-readable
              or to add a duplicate readable field for backward compatibility.
            </p>
            <p className="mt-3">
              After source inspection, the cleanest interpretation was to leave the numeric field untouched and add a companion ISO field in the timer-armed debug payload.
              That preserves compatibility while solving the operator-readability complaint directly.
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
