import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Pure metadata validation: no credentials, network, or execution of PR body text.
export function validatePullRequest(pr, repository) {
  const errors = [];
  const base = pr.base.ref;
  const head = pr.head.ref;
  const epic = /^epic\/([1-9]\d*)-[a-z0-9][a-z0-9-]*$/;
  const task = /^(?:feature|fix|chore)\/([1-9]\d*)-[a-z0-9][a-z0-9-]*$/;
  const headEpic = head.match(epic);
  const baseEpic = base.match(epic);
  const headTask = head.match(task);
  const sameRepository = pr.head.repo?.full_name === repository;
  const body = (pr.body ?? '').replace(/<!--[\s\S]*?-->/g, '');
  const ticketIds = [...body.matchAll(/^Ticket: https:\/\/github\.com\/([^\s]+)\/issues\/([1-9]\d*)\s*$/gm)]
    .filter((match) => match[1] === repository).map((match) => match[2]);
  const epicIds = [...body.matchAll(/^Epic: https:\/\/github\.com\/([^\s]+)\/issues\/([1-9]\d*)\s*$/gm)]
    .filter((match) => match[1] === repository).map((match) => match[2]);

  if (!ticketIds.length) errors.push('Add Ticket: https://github.com/' + repository + '/issues/<number> on its own line.');
  if (base === 'main') {
    if (head !== 'develop' || !sameRepository) errors.push('Only this repository’s develop branch may target main.');
  } else if (base === 'develop') {
    if (!headTask && !headEpic) errors.push('Use feature/<ticket>-<slug>, fix/<ticket>-<slug>, chore/<ticket>-<slug>, or epic/<ticket>-<slug> into develop.');
  } else if (baseEpic) {
    if (!headTask) errors.push('Only feature, fix, or chore task branches may target an epic branch.');
    if (!epicIds.includes(baseEpic[1])) errors.push('Link the target epic with Epic: https://github.com/' + repository + '/issues/' + baseEpic[1]);
  } else {
    errors.push('PRs must target develop, main, or epic/<ticket>-<slug>.');
  }
  const headTicket = headTask?.[1] ?? headEpic?.[1];
  if (headTicket && !ticketIds.includes(headTicket)) errors.push('The Ticket link must match the source branch ticket number.');
  if (headEpic && !epicIds.includes(headEpic[1])) errors.push('Epic integration PRs must link their epic with an Epic: URL.');
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const errors = validatePullRequest(event.pull_request, process.env.GITHUB_REPOSITORY);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log('PR route and ticket references satisfy repository policy.');
  }
}
