'use client';

import Link from 'next/link';
import { ScoreForm } from '@/components/ScoreForm';
import { StatsCards } from '@/components/StatsCards';
import { ScoreCard } from '@/components/ScoreCard';
import { useScoreGeneration } from '@/hooks/useScoreGeneration';
import { getTotalPar } from '@/lib/courses/presets';

export default function Home() {
  const { round, course, isGenerating, error, generate } = useScoreGeneration();

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl">&#129302;</span>
              <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                GOLF GHOST
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-cyan-400 bg-cyan-500/10 rounded-lg border border-cyan-500/20"
              >
                Generate
              </Link>
              <Link
                href="/manage"
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                Manage
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Subtitle */}
      <div className="text-center py-6">
        <p className="text-text-secondary text-sm md:text-base">
          AI-Powered Score Generation System
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 pb-8">
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
      <footer className="py-4 text-center text-text-muted text-sm border-t border-slate-700/50">
        <p>ghost.jurigregg.com</p>
      </footer>
    </main>
  );
}
