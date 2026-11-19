import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const rootDocs = new Set(['README.md', 'CONTRIBUTING.md', 'PRD.md', 'GLOSSARY.md']);
const sha = /^[a-f0-9]{40}$/;
const zero = '0'.repeat(40);

export function isDocsOnly(paths) {
  return paths.length > 0 && paths.every((path) => {
    if (/(^|\/)(AGENTS|CLAUDE)\.md$/i.test(path)) return false;
    return rootDocs.has(path) || (path.startsWith('docs/') && path.endsWith('.md'));
  });
}

export function comparisonRange(eventName, event) {
  const base = eventName === 'pull_request' ? event.pull_request?.base?.sha : event.before;
  const head = eventName === 'pull_request' ? event.pull_request?.head?.sha : event.after;
  if (!['push', 'pull_request'].includes(eventName) || !sha.test(base ?? '') || !sha.test(head ?? '') || base === zero || head === zero) return null;
  // PRs classify their complete diff, not just the latest commit. Pushes classify
  // all commits in the push, including removals. No branch names enter the shell.
  return `${base}${eventName === 'pull_request' ? '...' : '..'}${head}`;
}

export function detectDocsOnly(eventName, event, cwd = process.cwd()) {
  const range = comparisonRange(eventName, event);
  if (!range) return false;
  try {
    // Disable rename detection so moving executable/config files into docs cannot
    // hide the old non-documentation path. NUL separation preserves odd filenames.
    const output = execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', range, '--'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return isDocsOnly(output.split('\0').filter(Boolean));
  } catch {
    // Missing push ancestors, unavailable fork history, or Git errors run tests.
    console.log('Could not establish a docs-only diff; running full checks.');
    return false;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let docsOnly = false;
  try {
    docsOnly = detectDocsOnly(process.env.GITHUB_EVENT_NAME, JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')));
  } catch {
    console.log('Could not read event metadata; running full checks.');
  }
  appendFileSync(process.env.GITHUB_OUTPUT, `docs_only=${docsOnly}\n`);
  console.log(docsOnly ? 'Docs-only change: skipping code tests and recovery probes; PR policy still applies.' : 'Running full code checks.');
}
