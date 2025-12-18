/**
 * Type conversion utilities for API data
 */

import { PresetCourse } from '@/lib/courses/presets';
import { CourseRecord, CourseInput } from './types';

/**
 * Convert a CourseRecord from the API to PresetCourse format
 * Used by components that expect the PresetCourse interface
 */
export function courseRecordToPreset(record: CourseRecord): PresetCourse {
  return {
    id: record.courseId,
    name: record.name,
    teeName: record.teeName,
    courseRating: record.courseRating,
    slopeRating: record.slopeRating,
    parValues: record.parValues,
    holeHandicaps: record.holeHandicaps,
    yardages: record.yardages,
  };
}

/**
 * Convert multiple CourseRecords to PresetCourse format
 */
export function courseRecordsToPresets(records: CourseRecord[]): PresetCourse[] {
  return records.map(courseRecordToPreset);
}

/**
 * Convert a PresetCourse to CourseInput format for creating via API
 */
export function presetToCourseInput(preset: PresetCourse): CourseInput {
  return {
    name: preset.name,
    teeName: preset.teeName,
    courseRating: preset.courseRating,
    slopeRating: preset.slopeRating,
    parValues: preset.parValues,
    holeHandicaps: preset.holeHandicaps,
    yardages: preset.yardages,
  };
}
