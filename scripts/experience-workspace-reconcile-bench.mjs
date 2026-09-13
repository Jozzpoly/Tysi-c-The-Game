function assertUnique(cards, label) {
  if (new Set(cards).size !== cards.length) throw new Error(`${label}: duplicate card id`);
}

function survivorSequence(local, incoming) {
  const next = new Set(incoming);
  return local.filter((card) => next.has(card));
}

function reconcileCanonicalReset(_local, incoming) {
  return incoming.slice();
}

function reconcileStableIntake(local, incoming) {
  const incomingSet = new Set(incoming);
  const survivors = local.filter((card) => incomingSet.has(card));
  const localSet = new Set(local);
  const newcomers = incoming.filter((card) => !localSet.has(card));
  return [...survivors, ...newcomers];
}

function reconcileStableSuggested(local, incoming) {
  const incomingSet = new Set(incoming);
  const result = local.filter((card) => incomingSet.has(card));
  const present = new Set(result);
  const newcomers = incoming.filter((card) => !present.has(card));

  for (const newcomer of newcomers) {
    const canonicalIndex = incoming.indexOf(newcomer);
    let placed = false;

    // Suggest location from canonical neighbors without ever reordering survivors.
    for (let distance = 1; distance < incoming.length && !placed; distance += 1) {
      const left = canonicalIndex - distance;
      const right = canonicalIndex + distance;
      if (left >= 0 && present.has(incoming[left])) {
        const anchor = result.indexOf(incoming[left]);
        result.splice(anchor + 1, 0, newcomer);
        placed = true;
      } else if (right < incoming.length && present.has(incoming[right])) {
        const anchor = result.indexOf(incoming[right]);
        result.splice(anchor, 0, newcomer);
        placed = true;
      }
    }

    if (!placed) result.push(newcomer);
    present.add(newcomer);
  }

  return result;
}

const strategies = {
  W0: reconcileCanonicalReset,
  W1: reconcileStableIntake,
  W2: reconcileStableSuggested,
};

function pairOrderBreaks(previousLocal, nextLocal, incoming) {
  const survivors = survivorSequence(previousLocal, incoming);
  const position = new Map(nextLocal.map((card, i) => [card, i]));
  let breaks = 0;
  for (let i = 0; i < survivors.length; i += 1) {
    for (let j = i + 1; j < survivors.length; j += 1) {
      if (position.get(survivors[i]) > position.get(survivors[j])) breaks += 1;
    }
  }
  return breaks;
}

function exactTopologyPreserved(previousLocal, nextLocal, incoming) {
  const survivors = survivorSequence(previousLocal, incoming);
  const survivorSet = new Set(survivors);
  const nextSurvivors = nextLocal.filter((card) => survivorSet.has(card));
  return survivors.join('|') === nextSurvivors.join('|');
}

function newcomerPositions(previousLocal, nextLocal) {
  const previous = new Set(previousLocal);
  return nextLocal
    .map((card, index) => previous.has(card) ? null : ({ card, index }))
    .filter(Boolean);
}

const initialCanonical = ['9S', '10S', 'JS', 'QS', 'KS', 'AH', '9C', 'AC'];
const userLocal = ['QS', 'KS', '9S', '10S', 'JS', 'AH', '9C', 'AC'];

const transitions = [
  {
    name: 'legality-only revision',
    incoming: initialCanonical,
    explanation: 'membership unchanged; only legal command context changed',
  },
  {
    name: 'played one card',
    incoming: ['9S', '10S', 'JS', 'QS', 'AH', '9C', 'AC'],
    explanation: 'KS left canonical ownership after accepted play',
  },
  {
    name: 'received one card',
    incoming: ['9S', '10S', 'JS', 'QS', 'QD', 'AH', '9C', 'AC'],
    explanation: 'QD entered canonical ownership',
  },
  {
    name: 'reconnect same membership',
    incoming: ['9S', '10S', 'JS', 'QS', 'QD', 'AH', '9C', 'AC'],
    explanation: 'authoritative projection refreshed with same card membership',
  },
];

assertUnique(initialCanonical, 'initial canonical');
assertUnique(userLocal, 'initial local');

const reports = [];
for (const [model, reconcile] of Object.entries(strategies)) {
  let local = userLocal.slice();
  for (const transition of transitions) {
    assertUnique(transition.incoming, transition.name);
    const previous = local.slice();
    const next = reconcile(previous, transition.incoming);
    reports.push({
      model,
      transition: transition.name,
      explanation: transition.explanation,
      previous,
      incomingCanonical: transition.incoming,
      next,
      survivorOrderBreaks: pairOrderBreaks(previous, next, transition.incoming),
      survivorTopologyPreserved: exactTopologyPreserved(previous, next, transition.incoming),
      newcomers: newcomerPositions(previous, next),
    });
    local = next;
  }
}

console.log(JSON.stringify({
  version: 1,
  status: 'INTERNAL viewer-local workspace reconciliation bench',
  warning: 'This bench measures topology preservation under canonical membership changes. It does not prove cognitive benefit or preferred new-card placement.',
  models: {
    W0: 'canonical reset baseline',
    W1: 'stable survivors + explicit intake edge',
    W2: 'stable survivors + suggested canonical-neighbor insertion',
  },
  initialCanonical,
  initialUserTopology: userLocal,
  reports,
}, null, 2));
