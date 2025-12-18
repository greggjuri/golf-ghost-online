import { ScoreType } from '@/types';

export const scoreColors: Record<ScoreType, string> = {
  eagle: '#10b981',
  birdie: '#22d3ee',
  par: '#64748b',
  bogey: '#f59e0b',
  double: '#f97316',
  triple: '#ef4444',
};

export function getScoreColor(gross: number, par: number): string {
  const diff = gross - par;
  if (diff <= -2) return scoreColors.eagle;
  if (diff === -1) return scoreColors.birdie;
  if (diff === 0) return scoreColors.par;
  if (diff === 1) return scoreColors.bogey;
  if (diff === 2) return scoreColors.double;
  return scoreColors.triple;
}
