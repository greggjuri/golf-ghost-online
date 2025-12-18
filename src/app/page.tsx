'use client';

import { ScoreForm } from '@/components/ScoreForm';
import { StatsCards } from '@/components/StatsCards';
import { ScoreCard } from '@/components/ScoreCard';
import { useScoreGeneration } from '@/hooks/useScoreGeneration';
import { getTotalPar } from '@/lib/courses/presets';

export default function Home() {
  const { round, course, isGenerating, error, generate } = useScoreGeneration();

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="text-center mb-8 md:mb-12">
        <div className="flex items-center justify-center gap-3 md:gap-4 mb-2">
          <span className="text-4xl md:text-5xl" role="img" aria-label="robot">
            &#129302;
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight">
            GOLF GHOST
          </h1>
        </div>
        <p className="text-text-secondary text-sm md:text-base">
          AI-Powered Score Generation System
        </p>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-8">
              <ScoreForm onGenerate={generate} isGenerating={isGenerating} apiError={error} />
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-8">
            {round && course ? (
              <div className="space-y-6">
                {/* Stats Cards */}
                <StatsCards
                  grossScore={round.totalGross}
                  netScore={round.totalNet}
                  courseHandicap={round.courseHandicap}
                  totalPar={getTotalPar(course.parValues)}
                />

                {/* Scorecard */}
                <ScoreCard
                  round={round}
                  holeHandicaps={course.holeHandicaps}
                  yardages={course.yardages}
                />
              </div>
            ) : (
              /* Empty State */
              <div className="flex items-center justify-center h-64 lg:h-96 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4 opacity-30">&#127948;</div>
                  <p className="text-slate-500 text-lg">
                    Select a course and click Generate to see your ghost round
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 md:mt-16 text-center text-text-muted text-sm">
        <p>ghost.jurigregg.com</p>
      </footer>
    </main>
  );
}
