'use client';

import { useState, useEffect } from 'react';
import { CourseSelector } from './CourseSelector';
import { GlassButton } from './GlassButton';
import { GlassCard } from './GlassCard';
import { PresetCourse, getTotalPar, getTotalYardage, PRESET_COURSES } from '@/lib/courses/presets';

interface ScoreFormProps {
  onGenerate: (handicapIndex: number, course: PresetCourse) => Promise<void>;
  isGenerating: boolean;
  apiError?: string | null;
}

/**
 * Score generation form with course selection and handicap input
 */
export function ScoreForm({ onGenerate, isGenerating, apiError }: ScoreFormProps) {
  const [selectedCourse, setSelectedCourse] = useState<PresetCourse | null>(null);
  const [handicapIndex, setHandicapIndex] = useState<string>('15.0');
  const [error, setError] = useState<string | null>(null);

  // Set default course on mount
  useEffect(() => {
    const defaultCourse = PRESET_COURSES.find((c) => c.id === 'baytree-blue');
    if (defaultCourse) {
      setSelectedCourse(defaultCourse);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    const handicap = parseFloat(handicapIndex);
    if (isNaN(handicap) || handicap < 0 || handicap > 54) {
      setError('Handicap must be between 0 and 54');
      return;
    }

    onGenerate(handicap, selectedCourse);
  };

  return (
    <GlassCard className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">&#9881;</span>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">
            Configuration
          </h2>
        </div>

        {/* Course Selector */}
        <CourseSelector
          selectedCourseId={selectedCourse?.id || null}
          onSelect={setSelectedCourse}
        />

        {/* Handicap Input */}
        <div className="space-y-2">
          <label
            htmlFor="handicap-input"
            className="block text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Ghost GHIN Index
          </label>
          <input
            id="handicap-input"
            type="number"
            min="0"
            max="54"
            step="0.1"
            value={handicapIndex}
            onChange={(e) => setHandicapIndex(e.target.value)}
            className="
              w-full
              px-4 py-3
              bg-slate-900/80
              border border-slate-700
              rounded-lg
              text-slate-100
              text-sm font-semibold
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
              [appearance:textfield]
              [&::-webkit-outer-spin-button]:appearance-none
              [&::-webkit-inner-spin-button]:appearance-none
            "
            placeholder="15.0"
          />
        </div>

        {/* Course Info Display */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
          {selectedCourse ? (
            <div className="space-y-2">
              {[
                { label: 'Tee', value: selectedCourse.teeName },
                { label: 'Rating', value: selectedCourse.courseRating.toFixed(1) },
                { label: 'Slope', value: selectedCourse.slopeRating.toString() },
                { label: 'Par', value: getTotalPar(selectedCourse.parValues).toString() },
                { label: 'Yards', value: getTotalYardage(selectedCourse.yardages).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    {label}:
                  </span>
                  <span className="text-sm font-semibold text-cyan-400">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic text-center py-2">
              Select a course to view details
            </p>
          )}
        </div>

        {/* Error Display */}
        {(error || apiError) && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg px-4 py-2">
            <p className="text-sm text-red-400">{error || apiError}</p>
          </div>
        )}

        {/* Generate Button */}
        <GlassButton
          type="submit"
          variant="primary"
          loading={isGenerating}
          disabled={!selectedCourse}
          className="w-full py-4 text-base"
        >
          {isGenerating ? 'Generating...' : 'Generate Round'}
        </GlassButton>
      </form>
    </GlassCard>
  );
}
