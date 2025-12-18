'use client';

import { useState, useCallback } from 'react';
import { GhostGolfer, GhostGolferConfig } from '@/lib/scoring';
import { GeneratedRound } from '@/types';
import { PresetCourse } from '@/lib/courses/presets';

interface UseScoreGenerationReturn {
  round: GeneratedRound | null;
  course: PresetCourse | null;
  isGenerating: boolean;
  generate: (config: GhostGolferConfig, course: PresetCourse) => void;
  reset: () => void;
}

/**
 * Hook to manage score generation state and logic
 * Includes a small delay for UX feel
 */
export function useScoreGeneration(): UseScoreGenerationReturn {
  const [round, setRound] = useState<GeneratedRound | null>(null);
  const [course, setCourse] = useState<PresetCourse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback((config: GhostGolferConfig, selectedCourse: PresetCourse) => {
    setIsGenerating(true);

    // Small delay for UX feel (makes generation feel more substantial)
    setTimeout(() => {
      try {
        const golfer = new GhostGolfer(config);
        const generatedRound = golfer.generateRound();
        setRound(generatedRound);
        setCourse(selectedCourse);
      } catch (error) {
        console.error('Score generation failed:', error);
      } finally {
        setIsGenerating(false);
      }
    }, 300);
  }, []);

  const reset = useCallback(() => {
    setRound(null);
    setCourse(null);
  }, []);

  return {
    round,
    course,
    isGenerating,
    generate,
    reset,
  };
}
