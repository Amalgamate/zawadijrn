/**
 * Course Manager — LMS
 * Create, edit, delete, and view courses.
 */

import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useApi } from '../../../../hooks/useApi';
import { Card, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Badge } from '../../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Textarea } from '../../../ui/textarea';
import {
  Loader2, Plus, Edit, Trash2, Search, BookOpen, Users, Eye,
  X, ChevronLeft, ChevronRight
} from 'lucide-react';

const GRADES = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
const CATEGORIES = ['Core Subject', 'Elective', 'Co-curricular', 'Enrichment', 'Remedial'];

const emptyForm = { title: '', description: '', subject: '', grade: '', category: '', status: 'DRAFT' };

const statusColors = {
  PUBLISHED: 'bg-green-100 text-green-700 border-green-200',
  DRAFT:     'bg-gray-100 text-gray-600 border-gray-200',
  ARCHIVED:  'bg-amber-100 text-amber-700 border-amber-200',
};

const CourseManager = () => {
  const { can } = usePermissions();
  const { apiCall } = useApi();

  const [courses, setCourses]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null); // null = create, object = edit
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const canCreate = can('CREATE_COURSES');
  const canEdit   = can('EDIT_COURSES');
  const canDelete = can('DELETE_COURSES');

  useEffect(() => { load() }, [page, search, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...(search && { search }), ...(statusFilter !== 'all' && { status: statusFilter }) };
      const res = await apiCall(`/lms/courses?${new URLSearchParams(params)}`);
      setCourses(res.data?.data || res.data?.courses || []);
      setTotalPages(res.data?.pagination?.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setModalOpen(true); };
  const openEdit   = (c)  => { setEditing(c); setForm({ title: c.title, description: c.description || '', subject: c.subject, grade: c.grade, category: c.category, status: c.status }); setError(''); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.title || !form.subject || !form.grade || !form.category) { setError('Title, subject, grade, and category are required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await apiCall(`/lms/courses/${editing.id}`, 'PUT', form);
      } else {
        await apiCall('/lms/courses', 'POST', form);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course? This cannot be undone.')) return;
    try {
      await apiCall(`/lms/courses/${id}`, 'DELETE');
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete course.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-purple)]/30 focus:border-[var(--brand-purple)]"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-purple)] text-white rounded-lg font-medium hover:bg-purple-800 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus size={18} /> Create Course
          </button>
        )}
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-[var(--brand-purple)]" size={32} />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-semibold text-gray-600">No courses found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first course to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {courses.map(course => (
                <div key={course.id} className="p-5 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-bold text-gray-800 text-base">{course.title}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[course.status] || statusColors.DRAFT}`}>
                          {course.status}
                        </span>
                      </div>
                      {course.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{course.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="font-medium">{course.subject}</span>
                        <span>{course.grade}</span>
                        <span className="italic">{course.category}</span>
                        <span className="flex items-center gap-1"><Users size={12} />{course._count?.enrollments ?? 0} enrolled</span>
                        <span className="flex items-center gap-1"><BookOpen size={12} />{course._count?.content ?? 0} items</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {canEdit && (
                        <button onClick={() => openEdit(course)} className="p-2 text-gray-400 hover:text-[var(--brand-purple)] hover:bg-purple-50 rounded-lg transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(course.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Course' : 'Create New Course'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to Algebra" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of what learners will cover..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
                  <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade <span className="text-red-500">*</span></label>
                  <Select value={form.grade} onValueChange={v => setForm(f => ({ ...f, grade: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm bg-[var(--brand-purple)] text-white rounded-lg font-medium hover:bg-purple-800 disabled:opacity-60 transition-colors">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManager;
