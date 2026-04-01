type DiffLine = {
  kind: 'meta' | 'hunk' | 'add' | 'remove' | 'context';
  text: string;
};

function parseDiff(diff: string): DiffLine[] {
  return diff.split('\n').map((line) => {
    if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
      return { kind: 'meta', text: line };
    }
    if (line.startsWith('@@')) {
      return { kind: 'hunk', text: line };
    }
    if (line.startsWith('+')) {
      return { kind: 'add', text: line };
    }
    if (line.startsWith('-')) {
      return { kind: 'remove', text: line };
    }
    return { kind: 'context', text: line };
  });
}

function lineClass(kind: DiffLine['kind']) {
  switch (kind) {
    case 'meta':
      return 'bg-[#171b22] text-[#9fb0c3]';
    case 'hunk':
      return 'bg-[#1b2a41] text-[#8db4ff]';
    case 'add':
      return 'bg-[#12261b] text-[#9be9a8]';
    case 'remove':
      return 'bg-[#2d171d] text-[#ffb3ba]';
    case 'context':
    default:
      return 'bg-[#0d1117] text-[#c9d1d9]';
  }
}

function badgeClass(kind: DiffLine['kind']) {
  switch (kind) {
    case 'add':
      return 'bg-[#238636] text-white';
    case 'remove':
      return 'bg-[#da3633] text-white';
    case 'hunk':
      return 'bg-[#1f6feb] text-white';
    case 'meta':
      return 'bg-[#30363d] text-[#e6edf3]';
    default:
      return 'bg-[#21262d] text-[#9fb0c3]';
  }
}

function lineLabel(kind: DiffLine['kind']) {
  switch (kind) {
    case 'add':
      return '+';
    case 'remove':
      return '−';
    case 'hunk':
      return '@@';
    case 'meta':
      return '•';
    default:
      return ' '; 
  }
}

export function DiffViewer({ diff }: { diff: string }) {
  const lines = parseDiff(diff);

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-[#30363d] bg-[#0d1117] shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b949e]">Git diff</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={`${idx}-${line.text.slice(0, 24)}`} className={lineClass(line.kind)}>
                <td className="w-14 border-r border-[#21262d] px-3 py-2 align-top text-center">
                  <span className={`inline-flex min-w-[28px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${badgeClass(line.kind)}`}>
                    {lineLabel(line.kind)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-6">{line.text || ' '}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
