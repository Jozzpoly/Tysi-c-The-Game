import type { HandScoreSummary, Seat } from '../core/index.js';

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value}`;
}

export function ScoreSummary({
  summary,
  nameForSeat,
}: {
  summary: HandScoreSummary;
  nameForSeat: (seat: Seat) => string;
}) {
  const declarer = summary.seats[summary.declarer];
  return (
    <>
      <p>
        {nameForSeat(summary.declarer)}: {declarer.rawPoints} pkt przy kontrakcie {summary.contract} —{' '}
        {summary.contractMade ? 'kontrakt zrealizowany' : 'kontrakt niezrealizowany'}.
      </p>
      <div className="scoreboard" aria-label="Rozliczenie rozdania">
        {summary.seats.map((seat, index) => {
          const isDeclarer = index === summary.declarer;
          const points = seat.marriagePoints > 0
            ? `karty ${seat.cardPoints} + meldunki ${seat.marriagePoints} = ${seat.rawPoints}`
            : `karty ${seat.cardPoints} = ${seat.rawPoints}`;
          const reason = isDeclarer
            ? `kontrakt ${summary.contract}`
            : seat.locked
              ? `blokada ${summary.lockThreshold}+`
              : seat.scoreDelta !== seat.rawPoints
                ? 'po zaokrągleniu'
                : 'bez zmiany po zaokrągleniu';
          return (
            <div className="score" key={index}>
              <span>{nameForSeat(index as Seat)}</span>
              <strong>{signed(seat.scoreDelta)}</strong>
              <small>{points} · {reason}</small>
            </div>
          );
        })}
      </div>
    </>
  );
}
