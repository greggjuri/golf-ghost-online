'use client';

import { getScoreColor } from '@/lib/utils/colors';

interface HoleRowProps {
  hole: number | string; // number for holes, 'OUT'/'IN'/'TOT' for totals
  par: number;
  handicap?: number;
  yardage?: number;
  strokesReceived?: number;
  gross: number;
  net: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
}

/**
 * Single row in the scorecard table
 * Supports regular holes, subtotals (OUT/IN), and total row
 */
export function HoleRow({
  hole,
  par,
  handicap,
  yardage,
  strokesReceived,
  gross,
  net,
  isTotal = false,
  isSubtotal = false,
}: HoleRowProps) {
  const isSpecialRow = isTotal || isSubtotal;
  const rowBg = isTotal
    ? 'bg-slate-700/50'
    : isSubtotal
      ? 'bg-slate-800/50'
      : 'bg-transparent';
  const textWeight = isSpecialRow ? 'font-bold' : 'font-normal';

  // Get score color for gross (only for regular holes)
  const grossColor = isSpecialRow
    ? isTotal
      ? '#10b981' // Green for total
      : '#3b82f6' // Blue for subtotals
    : getScoreColor(gross, par);

  // Cell base styles
  const cellBase = `px-2 py-2 text-center text-sm ${textWeight}`;

  return (
    <tr className={`${rowBg} border-b border-slate-700/30`}>
      {/* Hole Number */}
      <td className={`${cellBase} text-slate-300`}>{hole}</td>

      {/* Yardage */}
      <td className={`${cellBase} text-slate-400`}>
        {yardage !== undefined ? yardage : ''}
      </td>

      {/* Par */}
      <td className={`${cellBase} text-slate-300`}>{par}</td>

      {/* Hole Handicap */}
      <td className={`${cellBase} text-slate-400`}>
        {handicap !== undefined ? handicap : ''}
      </td>

      {/* Strokes Received */}
      <td className={`${cellBase} text-slate-400`}>
        {strokesReceived !== undefined ? strokesReceived : ''}
      </td>

      {/* Gross Score */}
      <td className={`${cellBase} font-semibold`} style={{ color: grossColor }}>
        {gross}
      </td>

      {/* Net Score */}
      <td
        className={`${cellBase} font-semibold`}
        style={{ color: isSpecialRow ? grossColor : '#94a3b8' }}
      >
        {net}
      </td>
    </tr>
  );
}
