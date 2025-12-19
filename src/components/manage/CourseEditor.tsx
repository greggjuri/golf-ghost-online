'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { CourseRecord, CourseInput } from '@/lib/api/types';

interface CourseEditorProps {
  course: CourseRecord | null;
  onSave: (course: CourseInput) => Promise<void>;
  onDelete: (courseId: string) => Promise<void>;
  isSaving: boolean;
}

interface HoleData {
  par: number;
  yardage: number;
  handicap: number;
}

interface FormErrors {
  name?: string;
  teeName?: string;
  courseRating?: string;
  slopeRating?: string;
  holes?: string;
}

// Default values for a new course
const DEFAULT_PARS = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 5, 4, 3, 4, 4, 3, 5, 4];
const DEFAULT_YARDAGES = [395, 405, 185, 520, 380, 410, 165, 390, 535, 400, 545, 385, 175, 395, 420, 190, 510, 410];

function getDefaultHoles(): HoleData[] {
  return Array.from({ length: 18 }, (_, i) => ({
    par: DEFAULT_PARS[i],
    yardage: DEFAULT_YARDAGES[i],
    handicap: i + 1,
  }));
}

/**
 * Right panel component for editing course data
 * Includes header fields and 18-hole grid
 */
export function CourseEditor({
  course,
  onSave,
  onDelete,
  isSaving,
}: CourseEditorProps) {
  // Form state
  const [name, setName] = useState('');
  const [teeName, setTeeName] = useState('Blue');
  const [courseRating, setCourseRating] = useState('72.0');
  const [slopeRating, setSlopeRating] = useState('130');
  const [holes, setHoles] = useState<HoleData[]>(getDefaultHoles());
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load course data when selected course changes
  useEffect(() => {
    if (course) {
      setName(course.name);
      setTeeName(course.teeName);
      setCourseRating(course.courseRating.toString());
      setSlopeRating(course.slopeRating.toString());
      setHoles(
        course.parValues.map((par, i) => ({
          par,
          yardage: course.yardages[i],
          handicap: course.holeHandicaps[i],
        }))
      );
    } else {
      handleClear();
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [course]);

  const handleClear = () => {
    setName('');
    setTeeName('Blue');
    setCourseRating('72.0');
    setSlopeRating('130');
    setHoles(getDefaultHoles());
    setErrors({});
    setShowDeleteConfirm(false);
  };

  const updateHole = (index: number, field: keyof HoleData, value: number) => {
    setHoles((prev) =>
      prev.map((hole, i) => (i === index ? { ...hole, [field]: value } : hole))
    );
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Course name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    // Tee name validation
    if (!teeName.trim()) {
      newErrors.teeName = 'Tee name is required';
    } else if (teeName.length > 50) {
      newErrors.teeName = 'Tee name must be 50 characters or less';
    }

    // Course rating validation
    const rating = parseFloat(courseRating);
    if (isNaN(rating) || rating < 60 || rating > 80) {
      newErrors.courseRating = 'Rating must be between 60 and 80';
    }

    // Slope rating validation
    const slope = parseInt(slopeRating, 10);
    if (isNaN(slope) || slope < 55 || slope > 155) {
      newErrors.slopeRating = 'Slope must be between 55 and 155';
    }

    // Holes validation
    const handicaps = holes.map((h) => h.handicap);
    const uniqueHandicaps = new Set(handicaps);
    if (uniqueHandicaps.size !== 18) {
      newErrors.holes = 'Hole handicaps must be unique (1-18)';
    }

    for (let i = 0; i < 18; i++) {
      const hole = holes[i];
      if (hole.par < 3 || hole.par > 5) {
        newErrors.holes = `Hole ${i + 1}: Par must be 3, 4, or 5`;
        break;
      }
      if (hole.yardage < 50 || hole.yardage > 700) {
        newErrors.holes = `Hole ${i + 1}: Yardage must be between 50 and 700`;
        break;
      }
      if (hole.handicap < 1 || hole.handicap > 18) {
        newErrors.holes = `Hole ${i + 1}: Handicap must be between 1 and 18`;
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const courseInput: CourseInput = {
      name: name.trim(),
      teeName: teeName.trim(),
      courseRating: parseFloat(courseRating),
      slopeRating: parseInt(slopeRating, 10),
      parValues: holes.map((h) => h.par),
      holeHandicaps: holes.map((h) => h.handicap),
      yardages: holes.map((h) => h.yardage),
    };

    await onSave(courseInput);
  };

  const handleDelete = async () => {
    if (course) {
      await onDelete(course.courseId);
      setShowDeleteConfirm(false);
    }
  };

  const isEditing = course !== null;

  return (
    <GlassCard className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {isEditing ? 'Edit Course' : 'New Course'}
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Course Info Section */}
        <div className="space-y-4">
          {/* Course Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Course Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter course name..."
              className={`
                w-full px-4 py-2.5 rounded-lg
                bg-slate-900/80 border text-slate-100 text-sm
                placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                ${errors.name ? 'border-red-500' : 'border-slate-700'}
              `}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Tee Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Tee Name
            </label>
            <select
              value={teeName}
              onChange={(e) => setTeeName(e.target.value)}
              className={`
                w-full px-4 py-2.5 rounded-lg
                bg-slate-900/80 border text-slate-100 text-sm
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                cursor-pointer
                ${errors.teeName ? 'border-red-500' : 'border-slate-700'}
              `}
            >
              <option value="Blue">Blue</option>
              <option value="White">White</option>
              <option value="Red">Red</option>
              <option value="Gold">Gold</option>
              <option value="Black">Black</option>
            </select>
            {errors.teeName && <p className="mt-1 text-xs text-red-400">{errors.teeName}</p>}
          </div>

          {/* Rating and Slope - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Course Rating
              </label>
              <input
                type="number"
                step="0.1"
                min="60"
                max="80"
                value={courseRating}
                onChange={(e) => setCourseRating(e.target.value)}
                className={`
                  w-full px-4 py-2.5 rounded-lg
                  bg-slate-900/80 border text-slate-100 text-sm
                  focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                  ${errors.courseRating ? 'border-red-500' : 'border-slate-700'}
                `}
              />
              {errors.courseRating && <p className="mt-1 text-xs text-red-400">{errors.courseRating}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Slope Rating
              </label>
              <input
                type="number"
                min="55"
                max="155"
                value={slopeRating}
                onChange={(e) => setSlopeRating(e.target.value)}
                className={`
                  w-full px-4 py-2.5 rounded-lg
                  bg-slate-900/80 border text-slate-100 text-sm
                  focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                  ${errors.slopeRating ? 'border-red-500' : 'border-slate-700'}
                `}
              />
              {errors.slopeRating && <p className="mt-1 text-xs text-red-400">{errors.slopeRating}</p>}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50" />

        {/* Holes Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Hole Details
          </h3>
          {errors.holes && (
            <p className="mb-3 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
              {errors.holes}
            </p>
          )}

          {/* Holes Grid */}
          <div className="space-y-2">
            {/* Header Row */}
            <div className="grid grid-cols-[48px_1fr_1fr_1fr] gap-2 text-xs font-bold text-slate-500 uppercase px-2">
              <div>Hole</div>
              <div>Par</div>
              <div>Yards</div>
              <div>HCP</div>
            </div>

            {/* Front 9 */}
            {holes.slice(0, 9).map((hole, i) => (
              <HoleRow
                key={i}
                holeNumber={i + 1}
                hole={hole}
                onChange={(field, value) => updateHole(i, field, value)}
              />
            ))}

            {/* Front 9 Totals */}
            <div className="grid grid-cols-[48px_1fr_1fr_1fr] gap-2 text-xs font-bold text-cyan-400 px-2 py-2 bg-slate-800/50 rounded">
              <div>OUT</div>
              <div>{holes.slice(0, 9).reduce((sum, h) => sum + h.par, 0)}</div>
              <div>{holes.slice(0, 9).reduce((sum, h) => sum + h.yardage, 0)}</div>
              <div>-</div>
            </div>

            {/* Divider */}
            <div className="py-2" />

            {/* Back 9 */}
            {holes.slice(9, 18).map((hole, i) => (
              <HoleRow
                key={i + 9}
                holeNumber={i + 10}
                hole={hole}
                onChange={(field, value) => updateHole(i + 9, field, value)}
              />
            ))}

            {/* Back 9 Totals */}
            <div className="grid grid-cols-[48px_1fr_1fr_1fr] gap-2 text-xs font-bold text-cyan-400 px-2 py-2 bg-slate-800/50 rounded">
              <div>IN</div>
              <div>{holes.slice(9, 18).reduce((sum, h) => sum + h.par, 0)}</div>
              <div>{holes.slice(9, 18).reduce((sum, h) => sum + h.yardage, 0)}</div>
              <div>-</div>
            </div>

            {/* Total */}
            <div className="grid grid-cols-[48px_1fr_1fr_1fr] gap-2 text-xs font-bold text-emerald-400 px-2 py-2 bg-slate-800/50 rounded">
              <div>TOT</div>
              <div>{holes.reduce((sum, h) => sum + h.par, 0)}</div>
              <div>{holes.reduce((sum, h) => sum + h.yardage, 0)}</div>
              <div>-</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-slate-700/50 flex flex-wrap gap-3">
        <GlassButton onClick={handleSave} loading={isSaving} disabled={isSaving}>
          {isEditing ? 'Update Course' : 'Save Course'}
        </GlassButton>

        {isEditing && !showDeleteConfirm && (
          <GlassButton
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving}
          >
            Delete
          </GlassButton>
        )}

        {showDeleteConfirm && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-400">Delete this course?</span>
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        )}

        <GlassButton variant="secondary" onClick={handleClear} disabled={isSaving}>
          Clear
        </GlassButton>
      </div>
    </GlassCard>
  );
}

/**
 * Individual hole row component
 */
function HoleRow({
  holeNumber,
  hole,
  onChange,
}: {
  holeNumber: number;
  hole: HoleData;
  onChange: (field: keyof HoleData, value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[48px_1fr_1fr_1fr] gap-2 items-center">
      <div className="text-sm font-medium text-slate-400 px-2">{holeNumber}</div>
      <input
        type="number"
        min="3"
        max="5"
        value={hole.par}
        onChange={(e) => onChange('par', parseInt(e.target.value, 10) || 4)}
        className="w-full px-3 py-2 rounded bg-slate-900/80 border border-slate-700 text-slate-100 text-sm text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      />
      <input
        type="number"
        min="50"
        max="700"
        value={hole.yardage}
        onChange={(e) => onChange('yardage', parseInt(e.target.value, 10) || 400)}
        className="w-full px-3 py-2 rounded bg-slate-900/80 border border-slate-700 text-slate-100 text-sm text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      />
      <input
        type="number"
        min="1"
        max="18"
        value={hole.handicap}
        onChange={(e) => onChange('handicap', parseInt(e.target.value, 10) || 1)}
        className="w-full px-3 py-2 rounded bg-slate-900/80 border border-slate-700 text-slate-100 text-sm text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      />
    </div>
  );
}
