'use client';

import { GlassCard } from '@/components/GlassCard';
import { CourseRecord } from '@/lib/api/types';

interface CourseListProps {
  courses: CourseRecord[];
  selectedId: string | null;
  onSelect: (course: CourseRecord | null) => void;
  isLoading: boolean;
}

/**
 * Left panel component for displaying saved courses
 * Allows selecting a course to edit
 */
export function CourseList({
  courses,
  selectedId,
  onSelect,
  isLoading,
}: CourseListProps) {
  return (
    <GlassCard className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>Saved Courses</span>
          {!isLoading && (
            <span className="text-xs text-slate-500">({courses.length})</span>
          )}
        </h2>
      </div>

      {/* Course List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-500 text-sm">Loading courses...</div>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-center p-4">
            <div className="text-slate-500 text-sm">
              No courses saved yet.
              <br />
              Create one using the editor.
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            {courses.map((course) => (
              <li key={course.courseId}>
                <button
                  onClick={() => onSelect(course)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg
                    transition-all duration-150
                    ${
                      selectedId === course.courseId
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 border border-transparent'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{course.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {course.teeName} &bull; {course.courseRating}/{course.slopeRating}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* New Course Button */}
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={() => onSelect(null)}
          className={`
            w-full py-2.5 px-4 rounded-lg text-sm font-medium
            transition-all duration-150
            ${
              selectedId === null
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-slate-100 border border-transparent'
            }
          `}
        >
          + New Course
        </button>
      </div>
    </GlassCard>
  );
}
