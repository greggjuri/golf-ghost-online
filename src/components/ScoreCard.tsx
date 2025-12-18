'use client';

import { GeneratedRound } from '@/types';
import { GlassCard } from './GlassCard';
import { HoleRow } from './HoleRow';

interface ScoreCardProps {
  round: GeneratedRound;
  holeHandicaps: number[];
  yardages: number[];
}

interface NineSummary {
  par: number;
  gross: number;
  net: number;
  yardage: number;
  strokes: number;
}

/**
 * Full 18-hole scorecard with front 9, back 9, and total summaries
 */
export function ScoreCard({ round, holeHandicaps, yardages }: ScoreCardProps) {
  const { scores } = round;

  // Calculate front 9 (holes 1-9)
  const front9: NineSummary = scores.slice(0, 9).reduce(
    (acc, score, idx) => ({
      par: acc.par + score.par,
      gross: acc.gross + score.grossScore,
      net: acc.net + score.netScore,
      yardage: acc.yardage + (yardages[idx] || 0),
      strokes: acc.strokes + score.strokesReceived,
    }),
    { par: 0, gross: 0, net: 0, yardage: 0, strokes: 0 }
  );

  // Calculate back 9 (holes 10-18)
  const back9: NineSummary = scores.slice(9, 18).reduce(
    (acc, score, idx) => ({
      par: acc.par + score.par,
      gross: acc.gross + score.grossScore,
      net: acc.net + score.netScore,
      yardage: acc.yardage + (yardages[idx + 9] || 0),
      strokes: acc.strokes + score.strokesReceived,
    }),
    { par: 0, gross: 0, net: 0, yardage: 0, strokes: 0 }
  );

  // Calculate totals
  const total: NineSummary = {
    par: front9.par + back9.par,
    gross: front9.gross + back9.gross,
    net: front9.net + back9.net,
    yardage: front9.yardage + back9.yardage,
    strokes: front9.strokes + back9.strokes,
  };

  return (
    <GlassCard className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
        <span className="text-xl">&#128202;</span>
        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">
          Scorecard
        </h2>
      </div>

      {/* Table container with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Hole
              </th>
              <th className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Yds
              </th>
              <th className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Par
              </th>
              <th className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Hcp
              </th>
              <th className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Str
              </th>
              <th className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Gross
              </th>
              <th className="px-2 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Net
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Front 9 */}
            {scores.slice(0, 9).map((score, idx) => (
              <HoleRow
                key={score.hole}
                hole={score.hole}
                par={score.par}
                handicap={holeHandicaps[idx]}
                yardage={yardages[idx]}
                strokesReceived={score.strokesReceived}
                gross={score.grossScore}
                net={score.netScore}
              />
            ))}

            {/* OUT subtotal */}
            <HoleRow
              hole="OUT"
              par={front9.par}
              yardage={front9.yardage}
              strokesReceived={front9.strokes}
              gross={front9.gross}
              net={front9.net}
              isSubtotal
            />

            {/* Back 9 */}
            {scores.slice(9, 18).map((score, idx) => (
              <HoleRow
                key={score.hole}
                hole={score.hole}
                par={score.par}
                handicap={holeHandicaps[idx + 9]}
                yardage={yardages[idx + 9]}
                strokesReceived={score.strokesReceived}
                gross={score.grossScore}
                net={score.netScore}
              />
            ))}

            {/* IN subtotal */}
            <HoleRow
              hole="IN"
              par={back9.par}
              yardage={back9.yardage}
              strokesReceived={back9.strokes}
              gross={back9.gross}
              net={back9.net}
              isSubtotal
            />

            {/* Total */}
            <HoleRow
              hole="TOT"
              par={total.par}
              yardage={total.yardage}
              strokesReceived={total.strokes}
              gross={total.gross}
              net={total.net}
              isTotal
            />
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
