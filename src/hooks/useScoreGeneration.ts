'use client';

import { useState, useCallback } from 'react';
import { generateScore as apiGenerateScore, GenerateScoreRequest } from '@/lib/api';
import { GeneratedRound } from '@/types';
import { PresetCourse } from '@/lib/courses/presets';

interface UseScoreGenerationReturn {
  round: GeneratedRound | null;
  course: PresetCourse | null;
  isGenerating: boolean;
  error: string | null;
  generate: (handicapIndex: number, course: PresetCourse) => Promise<void>;
  reset: () => void;
}

/**
 * Hook to manage score generation state and logic
 * Uses the Lambda API for generation
 */
export function useScoreGeneration(): UseScoreGenerationReturn {
  const [round, setRound] = useState<GeneratedRound | null>(null);
  const [course, setCourse] = useState<PresetCourse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (handicapIndex: number, selectedCourse: PresetCourse) => {
    setIsGenerating(true);
    setError(null);

    try {
      const request: GenerateScoreRequest = {
        handicapIndex,
        courseRating: selectedCourse.courseRating,
        slopeRating: selectedCourse.slopeRating,
        parValues: selectedCourse.parValues,
        holeHandicaps: selectedCourse.holeHandicaps,
      };

      const generatedRound = await apiGenerateScore(request);
      setRound(generatedRound);
      setCourse(selectedCourse);
    } catch (err) {
      console.error('Score generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate score');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setRound(null);
    setCourse(null);
    setError(null);
  }, []);

  return {
    round,
    course,
    isGenerating,
    error,
    generate,
    reset,
  };
}
