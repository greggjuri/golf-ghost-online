'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CourseList } from '@/components/manage/CourseList';
import { CourseEditor } from '@/components/manage/CourseEditor';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CourseRecord, CourseInput } from '@/lib/api/types';
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/lib/api';
import { useAuth } from '@/lib/auth';

/**
 * Course Management Page
 * Allows users to create, edit, and delete golf courses
 * Protected - requires authentication
 */
export default function ManagePage() {
  return (
    <ProtectedRoute>
      <ManagePageContent />
    </ProtectedRoute>
  );
}

/**
 * Internal component with the actual page content
 */
function ManagePageContent() {
  const { user, signOut } = useAuth();
  // State
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch courses on mount
  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Clear messages after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handlers
  const handleSelectCourse = (course: CourseRecord | null) => {
    setSelectedCourse(course);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSave = async (courseInput: CourseInput) => {
    try {
      setIsSaving(true);
      setError(null);

      if (selectedCourse) {
        // Update existing course
        const updated = await updateCourse(selectedCourse.courseId, courseInput);
        setCourses((prev) =>
          prev.map((c) => (c.courseId === updated.courseId ? updated : c))
        );
        setSelectedCourse(updated);
        setSuccessMessage(`Course "${updated.name}" updated successfully!`);
      } else {
        // Create new course
        const created = await createCourse(courseInput);
        setCourses((prev) => [...prev, created]);
        setSelectedCourse(created);
        setSuccessMessage(`Course "${created.name}" created successfully!`);
      }
    } catch (err) {
      console.error('Failed to save course:', err);
      setError(err instanceof Error ? err.message : 'Failed to save course');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    try {
      setIsSaving(true);
      setError(null);

      await deleteCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
      setSelectedCourse(null);
      setSuccessMessage('Course deleted successfully!');
    } catch (err) {
      console.error('Failed to delete course:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setIsSaving(false);
    }
  };

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
            <nav className="flex items-center gap-2 md:gap-4">
              {/* User Info */}
              {user && (
                <span className="hidden md:inline text-sm text-slate-400">
                  {user}
                </span>
              )}
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                Generate
              </Link>
              <Link
                href="/manage"
                className="px-4 py-2 text-sm font-medium text-cyan-400 bg-cyan-500/10 rounded-lg border border-cyan-500/20"
              >
                Manage
              </Link>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Messages */}
      {(error || successMessage) && (
        <div className="max-w-7xl mx-auto px-4 pt-4 w-full">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {successMessage}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Course List */}
          <div className="lg:col-span-4 xl:col-span-3 h-full min-h-[300px] lg:min-h-0">
            <CourseList
              courses={courses}
              selectedId={selectedCourse?.courseId || null}
              onSelect={handleSelectCourse}
              isLoading={isLoading}
            />
          </div>

          {/* Right Panel - Course Editor */}
          <div className="lg:col-span-8 xl:col-span-9 h-full">
            <CourseEditor
              course={selectedCourse}
              onSave={handleSave}
              onDelete={handleDelete}
              isSaving={isSaving}
            />
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
