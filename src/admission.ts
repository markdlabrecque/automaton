import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { defineDoc, type Conversation, type SubmissionId } from '@earendil-works/pi-durable';

// Evaluation mapping, not a general-purpose runtime or a public product API.
const Admissions = defineDoc<{ items: { requestId: string; payload: string; id: number }[] }>({
  kind: 'automaton.probe.admissions', version: 1, scope: 'conversation', history: 'latest', fork: 'initial',
  initial: () => ({ items: [] }), checkpointWhen: () => false,
});

/** IDs are scoped to one conversation. A returned ID is not provisional. */
export async function admit(conversation: Conversation, requestId: string, payload: string): Promise<SubmissionId> {
  if (!requestId) throw new Error('requestId must not be empty');
  return conversation.commit(async tx => {
    const doc = await tx.doc(Admissions, conversation.id);
    const prior = doc.items.find(item => item.requestId === requestId);
    if (prior) {
      if (prior.payload !== payload) throw new Error('requestId conflict');
      const existing = await tx.submissionByRequest(conversation.id, requestId);
      if (!existing || existing.id !== prior.id) throw new Error('admission mapping inconsistent');
      return existing.id;
    }
    // Refuse pre-existing untracked upstream IDs rather than silently accepting an unknown payload.
    if (await tx.submissionByRequest(conversation.id, requestId)) throw new Error('untracked requestId');
    const id = await conversation.submit(tx, { type: 'write', requestId, entry: { kind: 'automaton.probe', data: payload } });
    doc.items.push({ requestId, payload, id });
    return id;
  }, BACKGROUND_CONTEXT);
}
