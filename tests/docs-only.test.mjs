import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isDocsOnly, comparisonRange, detectDocsOnly } from '../scripts/detect-docs-only.mjs';

const a = 'a'.repeat(40);
const b = 'b'.repeat(40);
test('only allowlisted documentation qualifies', () => {
  assert.equal(isDocsOnly(['README.md', 'CONTRIBUTING.md', 'PRD.md', 'GLOSSARY.md', 'docs/adr/decision.md']), true);
  for (const path of ['.github/workflows/ci.yml', 'scripts/example.mjs', 'tests/fixture.md', 'package-lock.json', 'AGENTS.md', 'docs/AGENTS.md', 'docs/CLAUDE.md', 'docs/helper.js', 'docs/image.png', 'investigations/example/README.md']) {
    assert.equal(isDocsOnly(['README.md', path]), false, path);
  }
  assert.equal(isDocsOnly([]), false);
  assert.equal(isDocsOnly(['docs/with\na newline.md']), true);
});
test('PRs use full merge-base diff and pushes use the full pushed range', () => {
  assert.equal(comparisonRange('pull_request', { pull_request: { base: { sha: a }, head: { sha: b } } }), `${a}...${b}`);
  assert.equal(comparisonRange('push', { before: a, after: b }), `${a}..${b}`);
});
test('manual, new/deleted branches, and malformed metadata fall back to full tests', () => {
  assert.equal(comparisonRange('workflow_dispatch', {}), null);
  for (const before of [undefined, '0'.repeat(40), 'HEAD; echo unsafe']) {
    assert.equal(comparisonRange('push', { before, after: b }), null);
  }
  assert.equal(comparisonRange('push', { before: a, after: '0'.repeat(40) }), null);
  assert.equal(comparisonRange('pull_request', {}), null);
});
test('real Git boundary: cumulative PRs, pushes, renamed code, missing history, and empty diffs', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'automaton-docs-'));
  // Isolate commits from the user's global hooks, signing, and daily log.
  const git = (...args) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', '-c', 'user.name=CI fixture', '-c', 'user.email=ci@example.invalid', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = () => { git('add', '.'); git('commit', '-m', 'fixture'); return git('rev-parse', 'HEAD'); };
  const push = (before, after) => detectDocsOnly('push', { before, after }, cwd);
  const pr = (base, head) => detectDocsOnly('pull_request', { pull_request: { base: { sha: base }, head: { sha: head } } }, cwd);
  try {
    git('init');
    writeFileSync(join(cwd, 'README.md'), 'Initial docs');
    writeFileSync(join(cwd, 'code.mjs'), 'export const value = 1;');
    const initial = commit();
    writeFileSync(join(cwd, 'README.md'), 'Updated docs');
    const docs = commit();
    assert.equal(push(initial, docs), true);
    assert.equal(pr(initial, docs), true);
    writeFileSync(join(cwd, 'code.mjs'), 'export const value = 2;');
    const code = commit();
    writeFileSync(join(cwd, 'README.md'), 'More docs');
    const laterDocs = commit();
    assert.equal(push(code, laterDocs), true);
    assert.equal(pr(initial, laterDocs), false, 'a docs tip must not hide earlier code changes');
    mkdirSync(join(cwd, 'docs'));
    renameSync(join(cwd, 'code.mjs'), join(cwd, 'docs', 'example.md'));
    const renamed = commit();
    assert.equal(push(laterDocs, renamed), false, 'the removed code path must count');
    rmSync(join(cwd, 'docs', 'example.md'));
    const deletedDocs = commit();
    assert.equal(push(renamed, deletedDocs), true);
    assert.equal(push(a, deletedDocs), false, 'unavailable history must run tests');
    assert.equal(push(deletedDocs, deletedDocs), false);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
