import { DiffViewer } from '@/components/DiffViewer';

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
            <span className="rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1">status: reviewable</span>
          </div>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[#3b3128]">
            Source inspection showed the issue was about the cron timer debug payload rather than CLI list output. That turned this into a textbook additive fix: keep numeric
            <code className="mx-1 rounded bg-[#f8f2ea] px-1.5 py-0.5 text-[13px]">nextAt</code>
            intact and add a human-readable ISO companion field.
          </p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Verification</div>
            <ul className="mt-3 space-y-2 text-[15px] leading-7 text-[#3b3128]">
              <li>• Targeted timer seam tests pass in the clean clone.</li>
              <li>• The fix is additive only: no change to stored state, cron scheduling, or CLI output.</li>
              <li>• Overlap scan did not reveal an open PR directly adding this exact readable debug field.</li>
            </ul>
          </div>
          <div className="rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Overlap scan summary</div>
            <p className="mt-3 text-[15px] leading-7 text-[#3b3128]">
              There is plenty of other cron work in flight, but nothing I found specifically overlaps this additive `nextAtReadable` field on the timer-armed debug log payload.
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
          <pre className="mt-4 overflow-x-auto rounded-[1.2rem] bg-[#20160f] p-5 text-[12px] leading-6 text-[#f7efe6]">{String.raw`## Summary
Add a human-readable nextAtReadable field to the cron timer debug payload while preserving the existing numeric nextAt field for machine consumers.

## Problem
Cron timer debug logs currently emit nextAt as a Unix timestamp. That is machine-friendly but awkward for operators reading debug output during scheduling diagnosis.

## Root cause
The timer arm log in src/cron/service/timer.ts only emits the raw numeric nextAt value, so human operators must manually convert it when reading logs.

## What changed
- keep nextAt unchanged
- add nextAtReadable: new Date(nextAt).toISOString() to the same debug payload
- add a focused timer seam test asserting the readable companion field is emitted

## What did not change
- no changes to cron job state storage
- no changes to scheduler behavior or timer calculation
- no changes to CLI cron list output
- no change to the canonical nextAt machine-readable field

## Test plan
- pnpm test -- src/cron/service/timer.test.ts
- verified targeted timer seam tests pass in clean clone

## Human verification
- inspect a cron: timer armed debug log entry
- confirm it now includes both numeric nextAt and ISO nextAtReadable

## Risk / mitigation
Very low risk. The change is additive and limited to a debug log payload, with focused seam coverage.`}</pre>
        </section>

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
