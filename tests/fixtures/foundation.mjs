import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { createModels } from '@earendil-works/pi-ai';
import { Harness, createRegistry, defineDoc, defineExtension, defineTask } from '@earendil-works/pi-durable';
import { openNodeSqliteStorage } from '@earendil-works/pi-durable/storage/sqlite/node';

export { context };
export const State = defineDoc({ kind: 'probe.state', version: 1, scope: 'conversation', history: 'latest', fork: 'initial', initial: () => ({ value: '' }), checkpointWhen: () => false });
export const Work = defineTask({
  name: 'probe.foundation', version: 1, initial: () => ({ phase: 'run' }),
  phases: { run: (task, runtime, c) => runtime.commit(() => ({ status: 'terminal', outcome: { status: 'completed', result: task.input } }), c) },
  abort: (_task, runtime, c) => runtime.commit(() => ({ status: 'terminal', outcome: { status: 'aborted' } }), c),
});
export async function open(db, wrap = storage => storage) {
  const registry = createRegistry();
  registry.install(defineExtension({ name: 'probe.foundation', tasks: [Work] }));
  const storage = await openNodeSqliteStorage(db);
  return Harness.open(wrap(storage), { models: createModels(), registry }, context);
}
