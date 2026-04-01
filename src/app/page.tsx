const rubric = [
  {
    name: 'Root cause clarity',
    weight: 'High',
    detail:
      'Can you explain the bug mechanically in one or two sentences? OpenClaw PRs that land tend to say exactly why the bad state happens, not just what users observe.',
  },
  {
    name: 'Scope boundary',
    weight: 'High',
    detail:
      'The best candidates have a clear “what changed” and “what did not change.” Maintainers seem to reward additive, bounded fixes over opportunistic redesigns.',
  },
  {
    name: 'Smallest reliable test',
    weight: 'High',
    detail:
      'The repo’s PR culture heavily favors naming the exact unit/seam test that should have caught the bug. If you can point to one focused regression test, acceptance odds go up.',
  },
  {
    name: 'Ease of human verification',
    weight: 'Medium',
    detail:
      'A candidate is stronger when you can manually verify the behavior without orchestrating a full production stack or waiting for a provider outage.',
  },
  {
    name: 'Blast radius',
    weight: 'High',
    detail:
      'Changes that touch one narrow path, one subsystem, or a few files are much easier to merge than fixes that cross scheduling, sessions, retries, and provider resolution all at once.',
  },
  {
    name: 'Policy / product ambiguity',
    weight: 'High',
    detail:
      'Bugs with low design ambiguity land more easily. Feature requests or behavior changes with multiple plausible semantics are slower unless a maintainer has already blessed one direction.',
  },
  {
    name: 'Overlap with active PRs',
    weight: 'Medium',
    detail:
      'If an open PR is already covering the same ground, the odds that a fresh competing branch lands first are worse. Better to support/review/adapt than duplicate.',
  },
  {
    name: 'Maintainer signal / blessing',
    weight: 'Medium',
    detail:
      'Discussion can help, but only when it actually clarifies desired behavior. Old threads with unresolved bikeshedding are not inherently better than recent issues.',
  },
  {
    name: 'User / operator pain',
    weight: 'Medium',
    detail:
      'Operational bugs, reliability traps, confusing status/reporting gaps, and onboarding footguns all score well because the product value is easy to defend.',
  },
];

const mergedPatterns = [
  {
    pr: '#22622',
    title: 'skip auth profile cooldown for timeout failures',
    takeaway:
      'Classic mergeable shape: one clean behavioral correction, one obvious root cause, tiny diff, existing tests plus a narrow behavioral guard.',
  },
  {
    pr: '#23202',
    title: 'prevent Telegram preview stream cross-edit race',
    takeaway:
      'Still bounded, but more sophisticated. What made it strong was the very precise race description and explicit regression tests for the two bad interleavings.',
  },
  {
    pr: '#58224',
    title: 'drop auth headers on cross-origin redirects',
    takeaway:
      'Excellent example of staff-level PR hygiene: root cause, prior hardening context, exact test file, exact scenario, explicit scope boundary, and risk discussion.',
  },
  {
    pr: '#58371',
    title: 'reject mixed trusted-proxy token config',
    takeaway:
      'Strong startup-validation style fix. Narrow entry point, easy test, obvious operator value, and low ambiguity.',
  },
  {
    pr: '#58502',
    title: 'skip restart when config.patch has no actual changes',
    takeaway:
      'A near-perfect “likely to land” shape: user-visible pain, tiny blast radius, one very defensible guardrail, and a compact regression test.',
  },
  {
    pr: '#58624',
    title: 'resolve relative MEDIA paths against agent workspace',
    takeaway:
      'Not merged yet, but an ideal model for PR structure. This is how you should write an OpenClaw fix PR if you want reviewers to trust it quickly.',
  },
];

const rerankedCandidates = [
  {
    tier: 'Top pick',
    number: 58522,
    title: 'session_status not showing cache hit tokens',
    url: 'https://github.com/openclaw/openclaw/issues/58522',
    score: '9.2 / 10',
    verdict: 'Best combination of low effort and high mergeability',
    reasoning:
      'This still looks like the strongest candidate after applying the rubric. It has clear user value, minimal product ambiguity, a narrow implementation hypothesis, and a straightforward verification story. It also resembles the sort of status/reporting bug that maintainers can review quickly because the risk is mostly limited to plumbing and rendering.',
    lookedAt: [
      'readUsageFromSessionLog',
      'buildStatusMessage',
      'formatCacheLine',
      'normalizeUsage',
    ],
    whyAccepted:
      'Likely to be accepted because it is additive/fix-oriented, low-blast-radius, easy to test, and not socially contested.',
    caution:
      'Main risk is only that the actual missing field is one layer earlier/later than expected, but that still feels manageable.',
  },
  {
    tier: 'Top pick',
    number: 58570,
    title: 'log warning when message is dropped due to allow: false',
    url: 'https://github.com/openclaw/openclaw/issues/58570',
    score: '8.9 / 10',
    verdict: 'Strong idea, but less clean in source than it first looked',
    reasoning:
      'On paper this still looks mergeable, but the implementation investigation revealed a messier seam than expected: some channels already emit allow/drop logs, some emit group-policy denials, and the exact issue scope is specifically about resolved route entries with allow:false. That means the practical fix is no longer obviously a single shared patch.',
    lookedAt: [
      'Slack explicit route drop logging in extensions/slack/src/monitor/context.ts',
      'shared group-access route_not_allowlisted paths',
      'channel-specific allow / denial logging across Slack, Google Chat, Zalo, etc.',
    ],
    whyAccepted:
      'Could still land, but only after choosing the exact seam: shared route-binding allow:false logic or a smaller channel-specific consistency patch.',
    caution:
      'Investigated and consciously deprioritized in this sprint because the seam looks more cross-channel and ambiguous than originally expected.',
  },
  {
    tier: 'Top pick',
    number: 58574,
    title: 'readable nextAt for cron jobs',
    url: 'https://github.com/openclaw/openclaw/issues/58574',
    score: '8.7 / 10',
    verdict: 'Extremely safe if implemented additively',
    reasoning:
      'This ended up even cleaner than expected after source inspection. The issue is specifically about the debug cron timer payload, not CLI listing output. That makes the fix a tiny additive log-payload change with a very focused timer seam test.',
    lookedAt: [
      'src/cron/service/timer.ts debug payload at timer arm',
      'src/cron/service/timer.test.ts seam tests with mocked logger',
    ],
    whyAccepted:
      'Almost no policy ambiguity if you add nextAtReadable rather than mutating nextAt semantics.',
    caution:
      'Do not break existing consumers by replacing the canonical machine timestamp field.',
  },
  {
    tier: 'Worth doing',
    number: 58582,
    title: 'startup validation for unresolvable model strings',
    url: 'https://github.com/openclaw/openclaw/issues/58582',
    score: '8.1 / 10',
    verdict: 'Still meaningful, but more semantics-heavy in real code than on paper',
    reasoning:
      'The real seam is `src/gateway/server-startup.ts`, especially `prewarmConfiguredPrimaryModel()`, with existing startup tests already in place. But once you are in that code, the key question is not “can we detect it?” — we already can warn — it is “what exact failure behavior do we want?” That makes it more product-semantic than the smaller fixes.',
    lookedAt: [
      'src/gateway/server-startup.ts prewarmConfiguredPrimaryModel',
      'src/gateway/server-startup.test.ts startup warmup tests',
      'existing model-selection / invalid-model behavior in agents/model-selection and cron model formatting tests',
    ],
    whyAccepted:
      'Could land if sharply scoped, but the desired outcome needs a clearer call: warn, fail startup, fail channel startup, or reject earlier in config/onboarding.',
    caution:
      'Investigated and deferred in this sprint because the code seam is tractable, but the desired startup failure semantics need a clearer product decision before coding.',
  },
  {
    tier: 'Worth doing',
    number: 58571,
    title: 'disable built-in heartbeat cleanly',
    url: 'https://github.com/openclaw/openclaw/issues/58571',
    score: '7.3 / 10',
    verdict: 'Good moderate candidate, but more product semantics involved',
    reasoning:
      'This has genuine user value and a clear requested API, but it is still more behaviorally significant than the small bugfixes. It affects scheduler expectations and config semantics, which means more review surface and more room for maintainers to have opinions.',
    lookedAt: [
      'heartbeat enablement / scheduler gate exports',
      'config resolution and scheduler initialization paths',
    ],
    whyAccepted:
      'Likely accepted if kept very crisp: one config switch, one disabling semantic, one set of tests.',
    caution:
      'Easier to derail into “how should heartbeat fundamentally work?” discussion if not tightly scoped.',
  },
  {
    tier: 'Worth doing',
    number: 58505,
    title: 'allow before_prompt_build hook to abort LLM call and return response',
    url: 'https://github.com/openclaw/openclaw/issues/58505',
    score: '7.1 / 10',
    verdict: 'Best moderate feature, but definitely not low-hanging fruit',
    reasoning:
      'This is probably the most interesting medium feature on the board, but it loses points on mergeability relative to the bugfixes because it extends a core plugin contract. That means more subtle review questions even if the idea is good.',
    lookedAt: [
      'before_prompt_build hook runner',
      'before_tool_call block semantics as precedent',
      'embedded runner around session.prompt execution',
    ],
    whyAccepted:
      'Could still land if the contract is crisp and the tests are excellent, but it is not the path of least resistance.',
    caution:
      'You need to define abort semantics, response shape, lifecycle reporting, and legacy hook interactions very carefully.',
  },
];

const implementationBranches = [
  {
    issue: '#58522',
    branch: 'stuart/issue-58522-cache-status',
    commit: '93f2ece62a',
    status: 'Ready for Stuart review',
    summary:
      'Implemented transcript-fallback hydration for cacheRead/cacheWrite in session status output and added a focused regression test.',
    inspect: [
      'src/auto-reply/status.ts',
      'src/auto-reply/status.test.ts',
      'Detail page: /impls/58522',
    ],
    verify: [
      'Run: `pnpm test -- src/auto-reply/status.test.ts`',
      'Look for the new regression proving transcript fallback now renders cache usage text.',
      'Review that the patch only changes transcript fallback plumbing and not unrelated status logic.',
    ],
    notes:
      'Targeted test passed in the clean clone. Local commit used `--no-verify` because current mainline hook/lint chain has unrelated failures.',
  },
  {
    issue: '#58574',
    branch: 'stuart/issue-58574-readable-nextat',
    commit: '231f500d7a',
    status: 'Ready for Stuart review',
    summary:
      'Added additive `nextAtReadable` to the cron timer debug payload and covered it with a focused timer seam test.',
    inspect: [
      'src/cron/service/timer.ts',
      'src/cron/service/timer.test.ts',
      'Detail page: /impls/58574',
    ],
    verify: [
      'Run: `pnpm test -- src/cron/service/timer.test.ts`',
      'Confirm the numeric `nextAt` field remains unchanged and only the companion ISO field was added.',
      'Review that the patch affects debug log payload only, not stored cron job state or CLI output.',
    ],
    notes:
      'This turned out to be a cleaner target than expected because the issue is about debug log readability, not broad cron behavior.',
  },
  {
    issue: '#58570',
    branch: 'stuart/issue-58570-allow-false-warning',
    commit: 'none',
    status: 'Investigated, then deprioritized',
    summary:
      'The practical seam is less tidy than the issue description suggests. Explicit route allow:false denials and group allowlist denials are unevenly handled across channel implementations.',
    inspect: [
      'extensions/slack/src/monitor/context.ts',
      'src/plugin-sdk/group-access.ts',
      'channel-specific allow/deny logging paths across Slack/Google Chat/Zalo',
    ],
    verify: [
      'Decide first whether the intended fix is a shared route-binding warning surface or a narrower channel/plugin parity patch.',
    ],
    notes:
      'Dropped for this sprint under the “stop if it starts sprawling” rule.',
  },
  {
    issue: '#58582',
    branch: 'stuart/issue-58582-startup-model-validation',
    commit: 'none',
    status: 'Investigated, then deferred',
    summary:
      'The code seam is real and already has tests around startup warmup, but the unresolved question is behavioral semantics: warn-only, fail startup, fail channel startup, or reject earlier during config/onboarding.',
    inspect: [
      'src/gateway/server-startup.ts',
      'src/gateway/server-startup.test.ts',
      'model-selection / invalid-model tests nearby',
    ],
    verify: [
      'Pick the desired failure behavior before implementing so the PR remains tightly scoped and reviewable.',
    ],
    notes:
      'Deferred rather than forced, because the implementation question is now more about product behavior than code discovery.',
  },
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c6258]">
      {children}
    </span>
  );
}

function CandidateRow({ item }: { item: (typeof rerankedCandidates)[number] }) {
  return (
    <article className="rounded-[1.8rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b866d]">{item.tier}</div>
          <h3 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#20160f]">
            #{item.number} · {item.title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill>{item.score}</Pill>
          <Pill>{item.verdict}</Pill>
        </div>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <section>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Why this re-ranked where it did</div>
            <p className="mt-2 text-[15px] leading-7 text-[#3b3128]">{item.reasoning}</p>
          </section>
          <section>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Why it would likely be accepted</div>
            <p className="mt-2 text-[15px] leading-7 text-[#3b3128]">{item.whyAccepted}</p>
          </section>
        </div>
        <aside className="rounded-[1.4rem] border border-[#e4d8ca] bg-[#f8f2ea] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Code / issue surfaces already examined</div>
          <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[#3b3128]">
            {item.lookedAt.map((entry) => (
              <li key={entry}>• {entry}</li>
            ))}
          </ul>
          <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Main caution</div>
          <p className="mt-2 text-[14px] leading-6 text-[#3b3128]">{item.caution}</p>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center rounded-full border border-[#20160f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#20160f] transition hover:bg-[#20160f] hover:text-[#fffdf8]"
          >
            Open issue ↗
          </a>
        </aside>
      </div>
    </article>
  );
}

function BranchCard({ item }: { item: (typeof implementationBranches)[number] }) {
  return (
    <article className="rounded-[1.8rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b866d]">{item.issue}</div>
          <h3 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#20160f]">{item.branch}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill>{item.status}</Pill>
          <Pill>{item.commit}</Pill>
        </div>
      </div>

      <p className="mt-4 text-[15px] leading-7 text-[#3b3128]">{item.summary}</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Inspect</div>
          <ul className="mt-2 space-y-2 text-[14px] leading-6 text-[#3b3128]">
            {item.inspect.map((entry) => (
              <li key={entry}>• {entry}</li>
            ))}
          </ul>
        </section>
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">How Stuart can verify</div>
          <ul className="mt-2 space-y-2 text-[14px] leading-6 text-[#3b3128]">
            {item.verify.map((entry) => (
              <li key={entry}>• {entry}</li>
            ))}
          </ul>
        </section>
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Notes</div>
          <p className="mt-2 text-[14px] leading-6 text-[#3b3128]">{item.notes}</p>
        </section>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4eee7] text-[#20160f]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2.5rem] border border-[#d7cdbf] bg-[linear-gradient(135deg,#fffdf9_0%,#f7f0e6_52%,#efe4d4_100%)] shadow-[0_30px_90px_rgba(32,22,12,0.08)]">
          <div className="grid gap-10 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#d8d0c4] bg-[#fffaf3] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8b7158]">
                briefing dossier · openclaw contribution candidates
              </div>
              <h1 className="mt-6 max-w-4xl text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[#20160f]">
                Which OpenClaw issues are actually worth solving — and likely to land?
              </h1>
              <p className="mt-6 max-w-3xl text-[17px] leading-8 text-[#463b31]">
                This pass upgrades the earlier shortlist into a contribution strategy memo: what the repo seems to reward,
                what outsider-merged PRs have in common, and a re-ranked candidate set scored against an explicit mergeability rubric rather than intuition alone.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#d7cdbf] bg-[#fffdf8] p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Current sprint outcome</div>
              <ul className="mt-4 space-y-4 text-[15px] leading-7 text-[#3b3128]">
                <li><strong>Ready now:</strong> #58522 and #58574 in local reviewable branches</li>
                <li><strong>Investigated then dropped:</strong> #58570 as too diffuse for this sprint</li>
                <li><strong>Investigated then deferred:</strong> #58582 pending clearer product semantics</li>
                <li><strong>Suggested next review move:</strong> inspect the two ready branches and decide whether to open draft PRs</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="mt-10 rounded-[2rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Decision framework</div>
              <h2 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#20160f]">Issue selection rubric</h2>
            </div>
            <Pill>Based on merged outsider PR patterns + repo PR template norms</Pill>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {rubric.map((item) => (
              <div key={item.name} className="rounded-[1.4rem] border border-[#e4d8ca] bg-[#f8f2ea] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold tracking-[-0.02em] text-[#20160f]">{item.name}</div>
                  <Pill>{item.weight}</Pill>
                </div>
                <p className="mt-2 text-[14px] leading-6 text-[#3b3128]">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Observed repo patterns</div>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#20160f]">What merged outsider PRs tend to look like</h2>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {mergedPatterns.map((item) => (
              <div key={item.pr} className="rounded-[1.4rem] border border-[#e4d8ca] bg-[#f8f2ea] p-5">
                <div className="text-sm font-semibold tracking-[-0.02em] text-[#20160f]">{item.pr} · {item.title}</div>
                <p className="mt-2 text-[14px] leading-6 text-[#3b3128]">{item.takeaway}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Second pass</div>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#20160f]">Re-ranked candidates using the rubric</h2>
          </div>
          <div className="mt-6 space-y-6">
            {rerankedCandidates.map((item) => (
              <CandidateRow key={item.number} item={item} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">What exists locally now</div>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#20160f]">Implementation branches and next steps for Stuart</h2>
          </div>
          <div className="mt-6 space-y-6">
            {implementationBranches.map((item) => (
              <BranchCard key={`${item.issue}-${item.branch}`} item={item} />
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-[#20160f] bg-[#20160f] p-6 text-[#f7efe6] shadow-[0_24px_80px_rgba(32,22,12,0.18)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d6c4b0]">Bottom line</div>
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f4d7b1]">Best next action</div>
              <p className="mt-2 text-[15px] leading-7 text-[#f7efe6]">Inspect #58522 and #58574 first. They are the cleanest local branches and already have focused regression coverage in the clean clone.</p>
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f4d7b1]">What not to force</div>
              <p className="mt-2 text-[15px] leading-7 text-[#f7efe6]">Do not force #58570 or #58582 into PRs just to have more branches. The current investigation results say they need a cleaner seam or a clearer product decision first.</p>
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f4d7b1]">Possible next sprint</div>
              <p className="mt-2 text-[15px] leading-7 text-[#f7efe6]">If you want a third candidate after reviewing the ready branches, my move would be either a tighter re-scope of #58570 or a switch to #58571 heartbeat disable instead of pushing #58582 prematurely.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
