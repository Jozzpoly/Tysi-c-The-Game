function planTrickScene({ before, events, after }) {
  const play = events.find((event) => event.type === 'card-played');
  const completed = events.find((event) => event.type === 'trick-completed');
  const beats = [];

  if (play) {
    beats.push({
      type: 'public-card-arrival',
      card: play.card,
      seat: play.seat,
      from: play.seat === before.viewerSeat ? `hand-card:${play.card}` : `seat:${play.seat}`,
      to: `trick-card:${play.seat}`,
    });
  }

  if (!completed) return { kind: 'play-only', beats };

  const { winner, points, plays, index } = completed.trick;
  const beforeValue = before.capturedCardPoints[winner];
  const afterValue = after.capturedCardPoints[winner];

  beats.push({ type: 'trick-close', index, plays, at: 'trick:shared', winner });
  beats.push({
    type: 'collect',
    cards: plays.map((item) => item.card),
    from: 'trick:shared',
    to: `captured:${winner}`,
  });
  beats.push({
    type: 'captured-value',
    seat: winner,
    points,
    before: beforeValue,
    after: afterValue,
    from: `captured:${winner}`,
    to: `captured-value:${winner}`,
  });
  beats.push({ type: 'initiative', seat: winner, to: `initiative:${winner}` });

  return { kind: 'trick-closure', winner, points, beats };
}

function scenario(winner) {
  const viewerSeat = 0;
  const play = { type: 'card-played', audience: 'public', seat: 0, card: 'AH' };
  const plays = [
    { seat: 1, card: '10H' },
    { seat: 2, card: 'KH' },
    { seat: 0, card: 'AH' },
  ];
  const points = 34;
  const beforeCaptured = [120, 90, 110];
  const afterCaptured = beforeCaptured.slice();
  afterCaptured[winner] += points;

  return {
    before: {
      viewerSeat,
      ownHand: ['AH', '9S', 'QD'],
      trick: plays.slice(0, 2),
      capturedCardPoints: beforeCaptured,
      scores: [320, 250, 410],
    },
    events: [
      play,
      { type: 'trick-completed', audience: 'public', trick: { plays, winner, points, index: 5 } },
    ],
    after: {
      viewerSeat,
      ownHand: ['9S', 'QD'],
      trick: [],
      lastCompletedTrick: { plays, winner, points, index: 5 },
      capturedCardPoints: afterCaptured,
      scores: [320, 250, 410],
      trickLeader: winner,
    },
  };
}

const closures = [0, 1, 2].map((winner) => ({ winner, plan: planTrickScene(scenario(winner)) }));
const playOnly = planTrickScene({
  before: { viewerSeat: 0, capturedCardPoints: [10, 20, 30] },
  events: [{ type: 'card-played', audience: 'public', seat: 1, card: '9C' }],
  after: { viewerSeat: 0, capturedCardPoints: [10, 20, 30] },
});

console.log(JSON.stringify({
  version: 1,
  status: 'INTERNAL semantic scene-plan bench',
  warning: 'Validates event/anchor causality only. Does not validate timing, visual quality, feel or comprehension.',
  closures,
  playOnly,
}, null, 2));
