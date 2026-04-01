export function PostingGuide({
  branch,
  verifyCommand,
  issueNumber,
}: {
  branch: string;
  verifyCommand: string;
  issueNumber: string;
}) {
  return (
    <section className="mt-8 rounded-[1.6rem] border border-[#d7cdbf] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(32,22,12,0.05)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7158]">Local verification + posting guide</div>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="text-sm font-semibold tracking-[-0.02em] text-[#20160f]">Local verification</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-7 text-[#3b3128]">
            <li><code className="rounded bg-[#f3ece3] px-1.5 py-0.5">cd ~/Developer/openclaw-contrib</code></li>
            <li><code className="rounded bg-[#f3ece3] px-1.5 py-0.5">git checkout {branch}</code></li>
            <li><code className="rounded bg-[#f3ece3] px-1.5 py-0.5">git status</code> and confirm only intended branch changes are present</li>
            <li><code className="rounded bg-[#f3ece3] px-1.5 py-0.5">{verifyCommand}</code></li>
            <li>Open the changed files and confirm the patch still matches the dossier narrative</li>
          </ol>
        </div>
        <div>
          <div className="text-sm font-semibold tracking-[-0.02em] text-[#20160f]">Posting later</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-7 text-[#3b3128]">
            <li>Make sure your worktree is clean and no unrelated files (like lockfiles) are staged.</li>
            <li>Push the branch to your fork/remote.</li>
            <li>Open a <strong>draft PR</strong> first if you want one more review loop before marking ready.</li>
            <li>Use the PR draft on this page, but map it into the repo’s actual PR template fields.</li>
            <li>Link the issue explicitly: <code className="rounded bg-[#f3ece3] px-1.5 py-0.5">Closes {issueNumber}</code>.</li>
            <li>Include at least one evidence artifact: test output snippet, before/after log, or screenshot.</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
