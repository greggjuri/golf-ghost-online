'use client';

import { GlassCard } from './GlassCard';

interface StatsCardsProps {
  grossScore: number;
  netScore: number;
  courseHandicap: number;
  totalPar: number;
}

/**
 * Format score relative to par (e.g., "+15", "-2", "E")
 */
function formatRelativeToPar(score: number, par: number): string {
  const diff = score - par;
  if (diff === 0) return 'E';
  if (diff > 0) return `+${diff}`;
  return diff.toString();
}

/**
 * Get color class based on score relative to par
 */
function getScoreColorClass(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -3) return 'text-emerald-400'; // Eagle or better
  if (diff <= -1) return 'text-cyan-400'; // Birdie
  if (diff === 0) return 'text-slate-400'; // Par
  if (diff === 1) return 'text-amber-400'; // Bogey
  if (diff === 2) return 'text-orange-400'; // Double
  return 'text-red-400'; // Triple+
}

interface StatCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  colorClass?: string;
  accentColor?: string;
}

function StatCard({ label, value, subtitle, colorClass = 'text-slate-100', accentColor }: StatCardProps) {
  return (
    <GlassCard className="flex-1 p-4 text-center">
      <div className={`text-4xl font-bold ${colorClass}`}>{value}</div>
      {subtitle && (
        <div className={`text-sm font-semibold ${colorClass} opacity-80`}>
          ({subtitle})
        </div>
      )}
      <div
        className="text-xs font-bold uppercase tracking-wider mt-2"
        style={{ color: accentColor || '#64748b' }}
      >
        {label}
      </div>
    </GlassCard>
  );
}

/**
 * Three stat cards displaying gross score, net score, and course handicap
 */
export function StatsCards({ grossScore, netScore, courseHandicap, totalPar }: StatsCardsProps) {
  const grossRelative = formatRelativeToPar(grossScore, totalPar);
  const netRelative = formatRelativeToPar(netScore, totalPar);
  const grossColorClass = getScoreColorClass(grossScore, totalPar);
  const netColorClass = getScoreColorClass(netScore, totalPar);

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        label="Gross Score"
        value={grossScore}
        subtitle={grossRelative}
        colorClass={grossColorClass}
        accentColor="#06b6d4"
      />
      <StatCard
        label="Net Score"
        value={netScore}
        subtitle={netRelative}
        colorClass={netColorClass}
        accentColor="#10b981"
      />
      <StatCard
        label="Course HCP"
        value={courseHandicap}
        colorClass="text-slate-100"
        accentColor="#f8fafc"
      />
    </div>
  );
}
