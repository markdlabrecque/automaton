import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { createModels, fauxAssistantMessage, fauxProvider } from '@earendil-works/pi-ai';
import { Harness, ReadOnlySession, createRegistry, defineExtension, defineTask } from '@earendil-works/pi-durable';
import { openNodeSqliteStorage } from '@earendil-works/pi-durable/storage/sqlite/node';

const crash = () => {
  process.kill(process.pid, 'SIGKILL');
  throw new Error('SIGKILL did not terminate the probe process');
};

async function withHarness(db, options, run) {
  const storage = await openNodeSqliteStorage(db);
  let harness;
  try {
    harness = await Harness.open(storage, options, context);
    await run(harness);
  } finally {
    if (harness) await harness.close(context);
    else await storage.close(context);
  }
}

function byInput(inspection) {
  return new Map(inspection.tasks.map(task => [task.record.input, task]));
}

// A passive barrier: unlike waitForTask(), Submission.wait(), or waitForIdle(),
// observing stored commits cannot start scheduling.
function observeRecord(harness, type, id, predicate) {
  const { promise, resolve } = Promise.withResolvers();
  const observation = harness.observeCommits({
    advance({ changes }) {
      const change = changes.find(c => c.type === type && c.value.id === id && predicate(c.value));
      if (change) resolve(change.value);
    },
    end() {},
  });
  return { promise, detach: () => observation.detach() };
}

async function sameKind(stage, db) {
  const work = defineTask({
    name: 'probe.work',
    version: 1,
    initial: () => ({ phase: 'run' }),
    phases: {
      run: (task, runtime, c) => runtime.commit(() => ({
        status: 'terminal', outcome: { status: 'completed', result: task.input },
      }), c),
    },
    abort: (_task, runtime, c) => runtime.commit(() => ({
      status: 'terminal', outcome: { status: 'aborted' },
    }), c),
  });
  const registry = createRegistry();
  const install = () => registry.install(defineExtension({ name: 'probe', tasks: [work] }));
  if (stage === 'seed') install();

  await withHarness(db, { models: createModels(), registry }, async harness => {
    const root = await harness.root(context);
    if (stage === 'seed') {
      await root.commit(async tx => {
        for (const input of ['old-a', 'old-b']) {
          await tx.createTask(work, input, { ownership: { kind: 'conversation' } });
        }
      }, context);
      const before = await harness.inspect(context);
      assert.equal(before.scheduling, 'paused');
      assert.deepEqual(before.tasks.map(t => t.state.kind), ['pending', 'pending']);
      crash();
    }

    assert.equal(stage, 'release');
    const before = await harness.inspect(context);
    const held = byInput(before);
    assert.equal(before.scheduling, 'paused');
    assert.deepEqual([...held.keys()].sort(), ['old-a', 'old-b']);
    for (const task of held.values()) {
      assert.deepEqual(task.state, { kind: 'blocked', reason: 'missing_task' });
    }

    const write = await root.submit({ type: 'write', entry: { kind: 'probe.note', data: 'new' } }, context);
    assert.equal((await write.wait(context)).status, 'done');
    const afterWrite = await harness.inspect(context);
    assert.equal(afterWrite.scheduling, 'running');
    assert.deepEqual(byInput(afterWrite), held);
    console.log('same-kind: a new write settled while both restored tasks were blocked');

    const selected = held.get('old-a').record.id;
    const peer = held.get('old-b').record.id;
    const peerTerminal = observeRecord(harness, 'task', peer, record => record.state.status === 'terminal');
    try {
      install();
      const result = await harness.waitForTask(selected, context);
      assert.deepEqual(result.state.outcome, { status: 'completed', result: 'old-a' });
      const peerRecord = await peerTerminal.promise;
      assert.deepEqual(peerRecord.state.outcome, { status: 'completed', result: 'old-b' });
    } finally {
      peerTerminal.detach();
    }
    console.log('same-kind: reinstalling the shared definition released both tasks, not just old-a');
  });
}

async function generation(stage, db) {
  const models = createModels();
  const faux = fauxProvider();
  models.setProvider(faux.provider);
  const model = faux.getModel();
  const reply = 'synthetic answer';
  faux.setResponses([stage === 'seed' ? crash : fauxAssistantMessage(reply)]);
  const options = {
    models,
    registry: createRegistry(),
    readOnly: stage === 'inspect',
    settings: { retry: { enabled: false } },
  };

  await withHarness(db, options, async harness => {
    const root = await harness.root(context, { agent: { model: { provider: model.provider, modelId: model.id } } });
    if (stage === 'seed') {
      await root.submit({ type: 'input', content: 'old question', requestId: 'old' }, context);
      await harness.waitForIdle(context);
      assert.fail('The synthetic provider did not reach the crash barrier');
    }

    const before = await harness.inspect(context);
    assert.equal(before.scheduling, 'paused');
    assert.equal(before.tasks.length, 1);
    const [task] = before.tasks;
    assert.equal(task.record.kind, 'pi.generation');
    assert.equal(before.submissions.length, 1);
    const [old] = before.submissions;
    assert.equal(old.requestId, 'old');
    assert.equal(old.status, 'placed');
    if (stage === 'inspect') {
      assert.equal(task.record.state.status, 'running');
      assert.throws(() => harness.resume(), ReadOnlySession);
      await assert.rejects(root.submit({ type: 'input', content: 'new question' }, context), ReadOnlySession);
      assert.deepEqual(await harness.inspect(context), before);
      assert.equal(faux.state.callCount, 0);
      console.log('generation: read-only Harness preserved the interrupted task and refused admission and scheduling');
      return;
    }

    assert.equal(stage, 'admit');
    assert.equal(task.state.kind, 'pending');
    assert.equal(task.record.state.status, 'pending');
    assert.equal(task.record.restarts, 1);
    // Use an independent conversation to isolate scheduler-wide recovery from same-conversation inbox rules.
    const fresh = await harness.createConversation({
      ownership: { kind: 'ownerless' },
      agent: { model: { provider: model.provider, modelId: model.id } },
    }, context);
    assert.deepEqual(await harness.inspect(context), before);
    const oldSettlement = observeRecord(harness, 'submission', old.id, receipt => receipt.status !== 'placed');
    try {
      const added = await fresh.submit({ type: 'input', content: 'new question', requestId: 'new' }, context);
      const oldReceipt = await oldSettlement.promise;
      assert.equal(oldReceipt.status, 'unanswered');
      assert.equal(oldReceipt.reason, 'interrupted');

      const answer = await added.wait(context);
      assert.equal(answer.status, 'done');
      assert.ok(answer.answer);
      const view = await fresh.context(context);
      assert.ok(view.messages.some(message => message.role === 'assistant' &&
        message.content.some(block => block.type === 'text' && block.text === reply)));
      assert.equal(faux.state.callCount, 1);
      assert.ok(!(await harness.inspect(context)).tasks.some(t => t.record.id === task.record.id));
    } finally {
      oldSettlement.detach();
    }
    console.log('generation: new input answered, but the unselected restored input settled as interrupted');
  });
}

const cases = { 'same-kind': sameKind, generation };
const [name, stage, db] = process.argv.slice(2);
if (name) {
  await cases[name](stage, db);
} else {
  const dir = mkdtempSync(join(tmpdir(), 'automaton-selective-recovery-'));
  try {
    for (const [scenario, stages] of Object.entries({
      'same-kind': ['seed', 'release'],
      generation: ['seed', 'inspect', 'admit'],
    })) {
      for (const step of stages) {
        const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), scenario, step, join(dir, `${scenario}.sqlite`)], {
          stdio: 'inherit', timeout: 15_000,
        });
        assert.ifError(child.error);
        if (step === 'seed') assert.equal(child.signal, 'SIGKILL', `${scenario}: seed did not crash at its barrier`);
        else assert.equal(child.status, 0, `${scenario}: ${step} failed (${child.signal ?? child.status})`);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
