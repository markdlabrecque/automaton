import { writeSync } from 'node:fs';
import { admit } from '../../dist/admission.js';
import { open, context, State, Work } from './foundation.mjs';

const harness = await open(process.argv[2]);
const root = await harness.root(context);
const receipt = await admit(root, 'request-1', 'synthetic payload');
const resultTask = await root.commit(tx => tx.createTask(Work, 'synthetic result', { ownership: { kind: 'conversation' } }), context);
await harness.waitForTask(resultTask, context);
const pending = await root.commit(async tx => {
  (await tx.doc(State, root.id)).value = 'committed document';
  return tx.createTask(Work, 'pending', { ownership: { kind: 'conversation' } });
}, context);
// The stdout barrier is emitted only after each immediate commit resolved. The parent
// verifies SIGKILL before opening a fresh Harness; no timer is used as a barrier.
writeSync(1, JSON.stringify({ receipt, resultTask, pending }) + '\n');
process.kill(process.pid, 'SIGKILL');
