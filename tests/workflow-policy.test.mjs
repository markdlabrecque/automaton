import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePullRequest } from '../scripts/check-pr-policy.mjs';

const repository = 'markdlabrecque/automaton';
const ticket = (id) => `Ticket: https://github.com/${repository}/issues/${id}`;
const epic = (id) => `Epic: https://github.com/${repository}/issues/${id}`;
function check(head, base, body = ticket(2), source = repository) {
  return validatePullRequest({ head: { ref: head, repo: { full_name: source } }, base: { ref: base }, body }, repository);
}

for (const kind of ['feature', 'fix', 'chore']) {
  test(`${kind} ticket can merge into develop or its linked epic`, () => {
    assert.deepEqual(check(`${kind}/2-example`, 'develop'), []);
    assert.deepEqual(check(`${kind}/2-example`, 'epic/1-slice', `${ticket(2)}\n${epic(1)}`), []);
  });
}
test('epic integration merges into develop with matching links', () => {
  assert.deepEqual(check('epic/1-slice', 'develop', `${ticket(1)}\n${epic(1)}`), []);
});
test('release comes only from this repository’s develop', () => {
  assert.deepEqual(check('develop', 'main', ticket(1)), []);
  for (const head of ['feature/2-example', 'epic/1-slice', 'main']) assert.ok(check(head, 'main').length);
  assert.ok(check('develop', 'main', ticket(1), 'someone/fork').length);
});
test('task and epic links must match their branch numbers', () => {
  assert.ok(check('feature/2-example', 'develop', ticket(3)).length);
  assert.ok(check('feature/2-example', 'epic/1-slice', `${ticket(2)}\n${epic(3)}`).length);
  assert.ok(check('epic/1-slice', 'develop', ticket(1)).length);
});
test('missing, cross-repository, commented, and malformed links are rejected', () => {
  for (const body of [null, '', 'Ticket: #2', '<!-- ' + ticket(2) + ' -->', ticket(2).replace(repository, 'other/repo'), ticket(2) + 'junk']) {
    assert.ok(check('feature/2-example', 'develop', body).length);
  }
});
test('unsupported routes and branch names are rejected', () => {
  for (const [head, base] of [['main', 'develop'], ['random', 'develop'], ['feature/0-example', 'develop'], ['feature/2-example', 'feature/3-other'], ['epic/2-other', 'epic/1-slice']]) {
    assert.ok(check(head, base).length);
  }
});
test('fork task PRs remain eligible for normal review and CI', () => {
  assert.deepEqual(check('feature/2-example', 'develop', ticket(2), 'someone/fork'), []);
});
