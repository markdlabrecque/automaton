import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { admit } from '../dist/admission.js';
import { open, context, State } from './fixtures/foundation.mjs';

const child = fileURLToPath(new URL('./fixtures/foundation-child.mjs', import.meta.url));
test('committed admission, document and task results survive SIGKILL and reopen', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'automaton-foundation-'));
  try {
    const db = join(dir, 'state.sqlite');
    const seed = spawnSync(process.execPath, [child, db], { encoding: 'utf8', timeout: 15000 });
    assert.ifError(seed.error);
    assert.equal(seed.signal, 'SIGKILL', seed.stderr);
    const ids = JSON.parse(seed.stdout.trim());
    const harness = await open(db);
    try {
      const root = await harness.root(context);
      assert.equal((await harness.submission(ids.receipt, context)).id, ids.receipt);
      assert.deepEqual(await Promise.all([
        admit(root, 'request-1', 'synthetic payload'), admit(root, 'request-1', 'synthetic payload'),
      ]), [ids.receipt, ids.receipt]);
      await assert.rejects(admit(root, 'request-1', 'different'), /conflict/);
      const entries = await root.entries({}, 100, undefined, context);
      assert.equal(entries.items.filter(e => e.kind === 'automaton.probe' && e.data === 'synthetic payload').length, 1);
      assert.deepEqual(await harness.snapshot(State, root.id, context), { value: 'committed document' });
      assert.deepEqual((await harness.getTask(ids.resultTask, context)).state.outcome, { status: 'completed', result: 'synthetic result' });
      assert.equal((await harness.getTask(ids.pending, context)).input, 'pending');
      const other = await harness.createConversation({ ownership: { kind: 'ownerless' } }, context);
      assert.notEqual(await admit(other, 'request-1', 'different'), ids.receipt);
    } finally { await harness.close(context); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('rolled-back admission is provisional; storage failure returns no receipt', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'automaton-foundation-failure-'));
  try {
    let fail = false;
    const db = join(dir, 'state.sqlite');
    const harness = await open(db, storage => new Proxy(storage, { get(target, key) {
      if (key === 'commit') return (...args) => fail ? Promise.reject(new Error('injected storage failure')) : target.commit(...args);
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }}));
    const root = await harness.root(context);
    let provisional;
    await assert.rejects(root.commit(async tx => {
      provisional = await root.submit(tx, { type: 'write', requestId: 'rolled-back', entry: { kind: 'probe.rollback' } });
      throw new Error('rollback');
    }, context), /rollback/);
    assert.equal(await harness.submission(provisional, context), undefined);
    fail = true;
    let receipt;
    await assert.rejects(async () => { receipt = await admit(root, 'failure', 'payload'); }, /injected storage failure/);
    assert.equal(receipt, undefined);
    await harness.close(context).catch(() => {});
    const reopened = await open(db);
    try {
      const again = await reopened.root(context);
      assert.equal(await reopened.submission(provisional, context), undefined);
      assert.equal(await again.commit(tx => tx.submissionByRequest(again.id, 'failure'), context), undefined);
      const id = await admit(again, 'failure', 'payload');
      assert.ok(id);
    } finally { await reopened.close(context); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
