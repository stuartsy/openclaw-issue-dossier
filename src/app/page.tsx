const easyCandidates = [
  {
    rank: '01',
    number: 58522,
    title: 'session_status not showing cache hit tokens despite provider returning cache usage data',
    url: 'https://github.com/openclaw/openclaw/issues/58522',
    labels: [],
    goodFirst: false,
    verdict: 'Strongest easy bugfix candidate',
    whyNow:
      'Very narrow surface area, issue author already isolated a plausible root cause, and the local code anchors line up with the report. High signal, low ambiguity.',
    problem:
      'OpenClaw already knows how to normalize cache usage from providers like Anthropic/OpenAI, and it already knows how to render a cache line in /status. The missing behavior appears to be a plumbing bug in the transcript-usage fallback path rather than missing product logic.',
    codeAreas: [
      'dist/auth-profiles-B5ypC5S-.js → readUsageFromSessionLog',
      'dist/auth-profiles-B5ypC5S-.js → buildStatusMessage',
      'dist/auth-profiles-B5ypC5S-.js → formatCacheLine',
      'dist/auth-profiles-B5ypC5S-.js → normalizeUsage',
    ],
    implementation:
      'Likely implementation is exactly the kind of patch you want for a first/next contribution: thread cacheRead/cacheWrite through readUsageFromSessionLog(), then allow buildStatusMessage() to hydrate missing cache fields from logUsage the same way it already does for core token counts.',
    verification:
      'Good verification story. This should be testable with a tiny transcript fixture or a narrow unit/seam test around status message construction. You can verify by forcing a usage payload with cache fields and asserting the rendered cache line appears.',
    overlap:
      'I did not see an open PR already covering this. No obvious overlap risk from the currently visible PR set.',
    risk:
      'Low. Mostly status/reporting path. Unlikely to affect core execution unless the status plumbing shares a wider type shape in unexpected places.',
    recommendation:
      'If you want one issue that is both credible and shippable quickly, this is my top pick.',
  },
  {
    rank: '02',
    number: 58574,
    title: 'readable nextAt value for cron job',
    url: 'https://github.com/openclaw/openclaw/issues/58574',
    labels: ['enhancement'],
    goodFirst: false,
    verdict: 'Excellent low-risk UX improvement',
    whyNow:
      'Small scope, clearly specified, and not entangled with model/runtime correctness.',
    problem:
      'The cron subsystem emits or stores nextAt as an epoch timestamp. That is machine-friendly but awkward for operators reading logs or debug output.',
    codeAreas: [
      'dist/gateway-cli-DlnlX7IW.js → cron wake scheduling path using nextAt',
      'cron store serialization / debug output paths (needs exact source lookup in repo)',
    ],
    implementation:
      'Safest move is additive: keep nextAt for compatibility, add nextAtReadable or similar in the relevant output surface(s). Avoid changing storage format unless there is a strong reason. This is a classic DX enhancement where backward compatibility matters more than purity.',
    verification:
      'Easy. Snapshot-style tests or JSON-shape tests are enough. Can also verify manually by listing cron jobs or inspecting the relevant status/debug output.',
    overlap:
      'No visible overlapping PR from the open PR set I checked.',
    risk:
      'Very low if additive. Slightly higher if you try to change the canonical field rather than adding a companion field.',
    recommendation:
      'Great if you want a contribution that is obviously useful and unlikely to turn into a rabbit hole.',
  },
  {
    rank: '03',
    number: 58570,
    title: 'Gateway should log warning when message is dropped due to allow: false',
    url: 'https://github.com/openclaw/openclaw/issues/58570',
    labels: [],
    goodFirst: false,
    verdict: 'Small, pragmatic observability fix',
    whyNow:
      'This is exactly the kind of operational bug that makes systems feel haunted. The request is narrowly scoped and product intent is clear: keep fail-closed semantics, improve diagnosability.',
    problem:
      'Messages dropped by a policy route with allow: false currently disappear without enough operator signal, making policy-denial and transport/routing failures look similar during incident response.',
    codeAreas: [
      'routing / outbound channel resolution path where allow:false is enforced',
      'config resolution path hinted by dist/config-BWw9Yn0D.js blockedByAllow references',
      'logger / structured warn emission path',
    ],
    implementation:
      'Find the exact branch where an explicit resolved route is denied by allow:false, emit a structured warning with channel/provider/account/route/reason, and ideally dedupe or rate-limit. The key here is to log at the decision point, not after downstream send failure.',
    verification:
      'Moderately easy. Add a focused test that resolves a denied route and assert one warning log entry is emitted with machine-readable reason. Manual repro should also be simple with a temp config.',
    overlap:
      'No open PR overlap detected in the sample I reviewed.',
    risk:
      'Low if rate-limited. Slight risk of noisy logs if implemented naïvely in high-volume denied channels.',
    recommendation:
      'Good low-hanging fruit if you want something with immediate real-world operator value.',
  },
  {
    rank: '04',
    number: 58582,
    title: 'Model validation on startup: reject unresolvable model strings before accepting messages',
    url: 'https://github.com/openclaw/openclaw/issues/58582',
    labels: [],
    goodFirst: false,
    verdict: 'High-value but slightly sharper-edged than the small fixes above',
    whyNow:
      'The issue describes a bad official onboarding flow producing an unresolvable model string that then cascades into an outage loop. That is exactly the sort of product-quality issue worth fixing.',
    problem:
      'A broken configured model can survive long enough to trigger repeated runtime failures instead of being rejected at config/startup time. The failure mode is catastrophic relative to the size of the root cause.',
    codeAreas: [
      'model resolution paths emitting Unknown model',
      'startup / config load / prewarm logic referenced in CHANGELOG and gateway startup flow',
      'onboard model selection output path',
    ],
    implementation:
      'There are a few viable scopes. Best likely first patch: validate the configured default model (and perhaps key route-level defaults) during startup/config application, emit a clear error, and refuse to continue into message handling with that bad state. Depending on architecture, there may also be a second patch to sanitize the onboard selection that writes the bad string in the first place.',
    verification:
      'Reasonably testable, but not as tiny as the status/cron/logging fixes. You would want one startup/config validation test and one regression scenario proving the gateway does not enter the retry loop with an invalid configured model.',
    overlap:
      'Touches adjacent terrain to the broader failover/retry issue cluster, but I did not see an open PR specifically covering this exact startup validation behavior.',
    risk:
      'Low-to-medium. Startup validation is usually good, but the tricky part is deciding how broadly to validate without rejecting legitimate optional configs or plugin-provided models too aggressively.',
    recommendation:
      'Worth doing, but I would treat it as “easy-medium,” not “tiny.” Good candidate if you want something meaningful but still bounded.',
  },
];

const moderateCandidates = [
  {
    rank: '05',
    number: 58571,
    title: 'Add agents.defaults.heartbeat configuration option to disable built-in heartbeat',
    url: 'https://github.com/openclaw/openclaw/issues/58571',
    labels: [],
    goodFirst: false,
    verdict: 'Moderate-sized, high user value, emotionally charged but product-relevant',
    whyNow:
      'There is a direct user pain story here, and the requested API is extremely clear: agents.defaults.heartbeat = false. The issue is not asking for a redesign, just a disable path.',
    problem:
      'The current heartbeat behavior is too opinionated for some assistant setups and can destroy valuable context. A first-class config off-switch would reduce surprise and align the product with more real deployment patterns.',
    codeAreas: [
      'heartbeat config resolution (docs + runtime references)',
      'areHeartbeatsEnabled / setHeartbeatsEnabled exports in runtime bundle',
      'scheduler initialization / nextWakeAt scheduling paths',
    ],
    implementation:
      'The likely implementation is a config-resolution change plus scheduler gating. The interesting design question is whether false disables just periodic triggers, or prevents registration entirely. I would strongly prefer full disable semantics over “configured but never fires” hacks, as long as docs and runtime state are consistent.',
    verification:
      'Medium difficulty. You need a config-driven regression test proving no periodic heartbeat is scheduled/fired when disabled, plus one proof that existing configured heartbeat behavior remains unchanged when the setting is omitted or enabled.',
    overlap:
      'Related to broader heartbeat bugs and frustrations, including older critical bug reports. I did not see an open PR covering this specific config addition.',
    risk:
      'Medium. Scheduler/config changes can have weird edge effects, and heartbeat behavior touches user expectations. Still tractable.',
    recommendation:
      'Strong moderate candidate, especially because we already understand the user need deeply.',
  },
  {
    rank: '06',
    number: 58505,
    title: 'Allow before_prompt_build hook to abort LLM call and return a custom response',
    url: 'https://github.com/openclaw/openclaw/issues/58505',
    labels: ['enhancement'],
    goodFirst: false,
    verdict: 'Best moderate feature if you want something architectural but still crisp',
    whyNow:
      'The issue is well-written, the failure mode is credible, and the requested contract is concrete. It addresses a real limitation in plugin determinism, not just convenience.',
    problem:
      'Prompt-mutation hooks can influence the LLM call, but they cannot deterministically prevent it. That leaves plugin developers without a reliable hard-block equivalent for text generation, even though tool calls have one.',
    codeAreas: [
      'dist/auth-profiles-B5ypC5S-.js → hook runner for before_prompt_build',
      'legacy before_agent_start merge path',
      'before_tool_call block semantics as design precedent',
      'embedded runner path around prompt build and session.prompt invocation',
    ],
    implementation:
      'The clean design is to extend the hook result contract with abort and abortResponse, then intercept that before session.prompt executes. The subtle work is making sure all downstream lifecycle/reporting paths still emit coherent end-state data and that the behavior composes correctly with legacy before_agent_start.',
    verification:
      'Medium. You want deterministic hook-level tests proving zero LLM invocation, returned response delivery, and distinguishable end reason. There should also be coverage for omitted abortResponse default behavior.',
    overlap:
      'No overlapping open PR detected in the sample I reviewed.',
    risk:
      'Medium. This touches plugin contracts and the core agent loop, so behavior must be crisp. But the requested surface area is still relatively contained.',
    recommendation:
      'Excellent moderate-sized contribution if you want something respected by plugin authors and not just a tiny polish fix.',
  },
  {
    rank: '07',
    number: 58583,
    title: 'Log rotation: implement proper rotation instead of suppression at 500MB',
    url: 'https://github.com/openclaw/openclaw/issues/58583',
    labels: [],
    goodFirst: false,
    verdict: 'Useful, but partially contested by an already-open PR',
    whyNow:
      'Operationally important. The current suppression behavior is bad under error storms because the system goes dark exactly when you need logs most.',
    problem:
      'The current cap prevents disk exhaustion but does so by suppressing writes entirely after the cap, which destroys diagnosis during active failures.',
    codeAreas: [
      'src/logging/logger.ts (per PR #58621)',
      'logging.maxFileBytes docs/config behavior',
    ],
    implementation:
      'Implement size-based rolling files with retention rather than suppression. The existing PR suggests this can be done with a relatively compact change in logger.ts.',
    verification:
      'Medium. Needs an integration-ish logger test or controlled temp-file scenario proving rollover and continued writability after cap.',
    overlap:
      'Direct overlap with open PR #58621 by jyotimahapatra. That PR is small and already points at logger.ts. If you want this area, I would review/support/adapt that effort rather than start from scratch.',
    risk:
      'Medium. Logging changes can be deceptively cross-platform and may need care around file handles/rename semantics.',
    recommendation:
      'Good topic, but not my first recommendation for a fresh branch because there is already active overlap.',
  },
];

const adjacentPrs = [
  {
    number: 58621,
    title: 'add support for size based log file rolling update',
    url: 'https://github.com/openclaw/openclaw/pull/58621',
    note: 'Directly overlaps issue #58583. Small PR, single file: src/logging/logger.ts.',
  },
  {
    number: 58589,
    title: 'live session model switch no longer blocks failover',
    url: 'https://github.com/openclaw/openclaw/pull/58589',
    note: 'Relevant context if you touch the broader model retry/fallback cluster, but not directly overlapping the easier picks.',
  },
  {
    number: 58624,
    title: 'resolve relative MEDIA paths against agent workspace',
    url: 'https://github.com/openclaw/openclaw/pull/58624',
    note: 'Nice example of the kind of compact, testable bugfix that tends to land well.',
  },
  {
    number: 58502,
    title: 'skip restart when config.patch has no actual changes',
    url: 'https://github.com/openclaw/openclaw/pull/58502',
    note: 'Another good model for low-blast-radius OpenClaw fixes: sharp root cause, focused test, clear behavior delta.',
  },
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#d8d0c4] bg-[#f7f2eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c6258]">
      {children}
    </span>
  );
}

function CandidateCard({ item }: { item: (typeof easyCandidates)[number] | (typeof moderateCandidates)[number] }) {
  return (
    <article className="rounded-[2rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_20px_60px_rgba(32,22,12,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b866d]">candidate {item.rank}</div>
          <h3 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#20160f]">
            #{item.number} · {item.title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill>{item.verdict}</Pill>
          {item.labels.map((label) => (
            <Pill key={label}>{label}</Pill>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Why this is interesting</div>
          <p className="mt-2 text-[15px] leading-7 text-[#3b3128]">{item.whyNow}</p>
        </section>
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Recommendation</div>
          <p className="mt-2 text-[15px] leading-7 text-[#3b3128]">{item.recommendation}</p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <section>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Problem framing</div>
            <p className="mt-2 text-[15px] leading-7 text-[#3b3128]">{item.problem}</p>
          </section>
          <section>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Likely implementation shape</div>
            <p className="mt-2 text-[15px] leading-7 text-[#3b3128]">{item.implementation}</p>
          </section>
          <section>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Verification and confidence</div>
            <p className="mt-2 text-[15px] leading-7 text-[#3b3128]">{item.verification}</p>
          </section>
        </div>

        <aside className="rounded-[1.5rem] border border-[#e4d8ca] bg-[#f8f2ea] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Code areas already inspected</div>
          <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[#3b3128]">
            {item.codeAreas.map((area) => (
              <li key={area}>• {area}</li>
            ))}
          </ul>

          <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Overlap / coordination</div>
          <p className="mt-2 text-[14px] leading-6 text-[#3b3128]">{item.overlap}</p>

          <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Risk profile</div>
          <p className="mt-2 text-[14px] leading-6 text-[#3b3128]">{item.risk}</p>

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
                A staff-level shortlist of OpenClaw issues worth Stuart’s time.
              </h1>
              <p className="mt-6 max-w-3xl text-[17px] leading-8 text-[#463b31]">
                This is not a generic GitHub dump. It is a deliberately filtered set of candidate issues and adjacent PR context,
                written as an engineering briefing: what to implement, where the code likely lives, how hard it is to verify,
                what overlap exists, and which items look like clean wins versus subtle traps.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#d7cdbf] bg-[#fffdf8] p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Executive summary</div>
              <ul className="mt-4 space-y-4 text-[15px] leading-7 text-[#3b3128]">
                <li>
                  <strong>Best easy bugfix:</strong> <span className="font-medium">#58522</span> session status cache usage.
                </li>
                <li>
                  <strong>Best low-risk enhancement:</strong> <span className="font-medium">#58574</span> readable cron <code>nextAt</code>.
                </li>
                <li>
                  <strong>Best pragmatic observability fix:</strong> <span className="font-medium">#58570</span> log dropped messages on <code>allow: false</code>.
                </li>
                <li>
                  <strong>Best medium-value product fix:</strong> <span className="font-medium">#58582</span> startup model validation.
                </li>
                <li>
                  <strong>Best moderate feature:</strong> <span className="font-medium">#58505</span> hook-level abort before LLM call.
                </li>
              </ul>
            </div>
          </div>
        </header>

        <section className="mt-10 rounded-[2rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Method</div>
              <p className="mt-2 text-[15px] leading-7 text-[#3b3128]">
                I pulled the live GitHub issue/PR metadata, then did targeted codebase inspection against local OpenClaw builds to anchor each recommendation in specific runtime surfaces rather than issue-title vibes.
              </p>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">What “already looked at” means</div>
              <p className="mt-2 text-[15px] leading-7 text-[#3b3128]">
                For the top candidates, I identified real function/area names in the shipped code paths. This is enough to estimate implementation shape and verification cost, but not yet a full branch-level code review of every edge case.
              </p>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">What I would do next before coding</div>
              <p className="mt-2 text-[15px] leading-7 text-[#3b3128]">
                Pick one or two candidates, inspect the exact source files in the repo rather than the bundled dist only, check for nearby tests, and then decide whether to write a narrow fix or coordinate around overlapping PRs.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Tier one</div>
              <h2 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#20160f]">Easy / low-hanging fruit</h2>
            </div>
          </div>
          <div className="mt-6 space-y-6">
            {easyCandidates.map((item) => (
              <CandidateCard key={item.number} item={item} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Tier two</div>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#20160f]">Moderate-sized work worth considering</h2>
          </div>
          <div className="mt-6 space-y-6">
            {moderateCandidates.map((item) => (
              <CandidateCard key={item.number} item={item} />
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Adjacent open PRs to know about</div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {adjacentPrs.map((pr) => (
              <a
                key={pr.number}
                href={pr.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-[1.5rem] border border-[#e4d8ca] bg-[#f8f2ea] p-5 transition hover:border-[#20160f] hover:bg-[#fff7ee]"
              >
                <div className="text-sm font-semibold tracking-[-0.02em] text-[#20160f]">PR #{pr.number} · {pr.title}</div>
                <p className="mt-2 text-[14px] leading-6 text-[#3b3128]">{pr.note}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-[#20160f] bg-[#20160f] p-6 text-[#f7efe6] shadow-[0_24px_80px_rgba(32,22,12,0.18)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d6c4b0]">My actual recommendation</div>
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f4d7b1]">If you want a fast win</div>
              <p className="mt-2 text-[15px] leading-7 text-[#f7efe6]">Take #58522 or #58570. Both look like clean, credible contributions with good leverage and manageable verification.</p>
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f4d7b1]">If you want something product-meaningful</div>
              <p className="mt-2 text-[15px] leading-7 text-[#f7efe6]">Take #58582 or #58571. They are more consequential and more “real product quality” than cosmetic polish, but still bounded enough to ship.</p>
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f4d7b1]">If you want a respected medium feature</div>
              <p className="mt-2 text-[15px] leading-7 text-[#f7efe6]">Take #58505. It is the most architectural item here that still feels crisply spec-able and testable.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
