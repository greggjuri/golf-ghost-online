'use client';

import { PRESET_COURSES, PresetCourse, getCourseDisplayName } from '@/lib/courses/presets';

interface CourseSelectorProps {
  selectedCourseId: string | null;
  onSelect: (course: PresetCourse | null) => void;
}

/**
 * Dropdown component for selecting preset golf courses
 */
export function CourseSelector({ selectedCourseId, onSelect }: CourseSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value;
    if (courseId === '') {
      onSelect(null);
    } else {
      const course = PRESET_COURSES.find((c) => c.id === courseId);
      if (course) {
        onSelect(course);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="course-select"
        className="block text-xs font-bold uppercase tracking-wider text-slate-400"
      >
        Course
      </label>
      <select
        id="course-select"
        value={selectedCourseId || ''}
        onChange={handleChange}
        className="
          w-full
          px-4 py-3
          bg-slate-900/80
          border border-slate-700
          rounded-lg
          text-slate-100
          text-sm
          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
          cursor-pointer
          appearance-none
          bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
          bg-no-repeat
          bg-[right_0.75rem_center]
          bg-[length:1.25rem_1.25rem]
          pr-10
        "
      >
        <option value="">Select a course...</option>
        {PRESET_COURSES.map((course) => (
          <option key={course.id} value={course.id}>
            {getCourseDisplayName(course)}
          </option>
        ))}
      </select>
    </div>
  );
}
