/**
 * GitNotificationDialog
 *
 * Admin-only dialog for composing and publishing a GIT_UPDATE in-app
 * notification. Reuses the existing notification infrastructure — no new
 * tables, no new bell component, no duplicate logic.
 *
 * Usage:
 *   <GitNotificationDialog open={open} onClose={() => setOpen(false)} />
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { cn } from '../../../utils/cn';
import api from '../../../services/api';
import {
  GitBranch,
  GitCommit,
  Rocket,
  User,
  Link2,
  Bell,
  AlertTriangle,
  Zap,
  Send,
  Eye,
  Save,
  X,
  CheckCircle2,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER',
  'PARENT', 'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
  'NURSE', 'SECURITY', 'IT_SUPPORT', 'HEAD_OF_CURRICULUM',
];

const PRIORITY_OPTIONS = [
  { value: 'NORMAL', label: 'Normal', icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
  { value: 'IMPORTANT', label: 'Important', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  { value: 'CRITICAL', label: 'Critical', icon: Zap, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
];

const DEFAULT_FORM = {
  title: '',
  message: '',
  priority: 'NORMAL',
  branch: 'main',
  commitSummary: '',
  pushedBy: '',
  commitUrl: '',
  targetRoles: ['SUPER_ADMIN', 'ADMIN'],
  showAsPopup: false,
  saveDraft: false,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function GitNotificationDialog({ open, onClose }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('compose'); // 'compose' | 'preview' | 'done'

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleRole = (role) => {
    set(
      'targetRoles',
      form.targetRoles.includes(role)
        ? form.targetRoles.filter((r) => r !== role)
        : [...form.targetRoles, role]
    );
  };

  const handlePreview = async () => {
    setError(null);
    setLoading(true);
    try {
      const resp = await api.gitNotifications.preview(form);
      if (resp.success) {
        setPreview(resp.data);
        setStep('preview');
      }
    } catch (e) {
      setError(e?.message || 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (draft = false) => {
    setError(null);
    setLoading(true);
    try {
      const resp = await api.gitNotifications.publish({ ...form, saveDraft: draft });
      if (resp.success) {
        setSuccess(resp.message);
        setStep('done');
      }
    } catch (e) {
      setError(e?.message || 'Publish failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(DEFAULT_FORM);
    setPreview(null);
    setSuccess(null);
    setError(null);
    setStep('compose');
    onClose();
  };

  const selectedPriority = PRIORITY_OPTIONS.find((p) => p.value === form.priority);
  const PriorityIcon = selectedPriority?.icon ?? Bell;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold uppercase tracking-wide">
            <Rocket size={18} className="text-brand-purple" />
            {step === 'done' ? 'Notification Sent' : 'Publish Git Update Notification'}
          </DialogTitle>
        </DialogHeader>

        {/* ── DONE ─────────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <p className="text-sm font-medium text-gray-700">{success}</p>
            <Button onClick={handleClose} className="mt-2 bg-brand-purple hover:bg-brand-purple/90">
              Close
            </Button>
          </div>
        )}

        {/* ── PREVIEW ──────────────────────────────────────────────────── */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className={cn('border rounded-xl p-4 space-y-3', selectedPriority?.bg)}>
              <div className="flex items-start gap-3">
                <PriorityIcon size={20} className={selectedPriority?.color} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{preview.title}</p>
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{preview.message}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 border-t border-white/50">
                {preview.metadata.branch && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                    <GitBranch size={11} /> {preview.metadata.branch}
                  </span>
                )}
                {preview.metadata.pushedBy && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                    <User size={11} /> {preview.metadata.pushedBy}
                  </span>
                )}
                {preview.metadata.commitUrl && (
                  <a
                    href={preview.metadata.commitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-medium text-blue-500 hover:underline"
                  >
                    <Link2 size={11} /> View commit
                  </a>
                )}
              </div>
              {preview.metadata.commitSummary && (
                <p className="text-[11px] text-gray-500 font-mono border-t border-white/50 pt-2">
                  {preview.metadata.commitSummary}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] font-semibold text-gray-500 uppercase mr-1">Targets:</span>
              {preview.targetRoles.map((r) => (
                <Badge key={r} variant="secondary" className="text-[9px]">{r.replace('_', ' ')}</Badge>
              ))}
            </div>

            {preview.showAsPopup && (
              <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                <Bell size={12} /> Will show as a popup on users' next login/refresh.
              </p>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('compose')} disabled={loading}>
                <X size={14} className="mr-1" /> Edit
              </Button>
              <Button variant="outline" onClick={() => handlePublish(true)} disabled={loading}>
                <Save size={14} className="mr-1" /> Save Draft
              </Button>
              <Button
                onClick={() => handlePublish(false)}
                disabled={loading}
                className="bg-brand-purple hover:bg-brand-purple/90"
              >
                <Send size={14} className="mr-1" />
                {loading ? 'Publishing…' : 'Publish Now'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── COMPOSE ──────────────────────────────────────────────────── */}
        {step === 'compose' && (
          <div className="space-y-5">
            {/* Title */}
            <Field label="Notification Title *">
              <input
                className={inputCls}
                placeholder="e.g. v2.4.1 — Fee collection improvements"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={200}
              />
            </Field>

            {/* Message */}
            <Field label="Message Body *">
              <textarea
                className={cn(inputCls, 'h-24 resize-none')}
                placeholder="Describe what changed, what's new, or what users should know…"
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                maxLength={2000}
              />
            </Field>

            {/* Priority */}
            <Field label="Priority">
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map(({ value, label, icon: Icon, color, bg }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('priority', value)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-all',
                      form.priority === value ? cn(bg, 'ring-2 ring-offset-1', color.replace('text-', 'ring-')) : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    )}
                  >
                    <Icon size={13} className={form.priority === value ? color : ''} />
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Git metadata */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Branch">
                <div className="relative">
                  <GitBranch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className={cn(inputCls, 'pl-8')}
                    placeholder="main"
                    value={form.branch}
                    onChange={(e) => set('branch', e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Pushed By">
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className={cn(inputCls, 'pl-8')}
                    placeholder="github-username"
                    value={form.pushedBy}
                    onChange={(e) => set('pushedBy', e.target.value)}
                  />
                </div>
              </Field>
            </div>

            <Field label="Commit Summary">
              <div className="relative">
                <GitCommit size={13} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  className={cn(inputCls, 'pl-8 h-16 resize-none font-mono text-[11px]')}
                  placeholder="fix: resolve fee balance display bug (#312)"
                  value={form.commitSummary}
                  onChange={(e) => set('commitSummary', e.target.value)}
                />
              </div>
            </Field>

            <Field label="Commit / PR URL (optional)">
              <div className="relative">
                <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className={cn(inputCls, 'pl-8')}
                  placeholder="https://github.com/org/repo/commit/abc123"
                  value={form.commitUrl}
                  onChange={(e) => set('commitUrl', e.target.value)}
                />
              </div>
            </Field>

            {/* Target Roles */}
            <Field label="Target Roles *">
              <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                {ALL_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRole(r)}
                    className={cn(
                      'px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wide transition-all',
                      form.targetRoles.includes(r)
                        ? 'bg-brand-purple text-white border-brand-purple'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-brand-purple/40'
                    )}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </Field>

            {/* Show as popup */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => set('showAsPopup', !form.showAsPopup)}
                className={cn(
                  'w-10 h-5 rounded-full border-2 relative transition-colors',
                  form.showAsPopup ? 'bg-brand-purple border-brand-purple' : 'bg-gray-200 border-gray-300'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all',
                    form.showAsPopup ? 'left-5' : 'left-0.5'
                  )}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">Show as popup alert</p>
                <p className="text-[10px] text-gray-400">Users see a modal on next login or refresh until dismissed.</p>
              </div>
            </label>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handlePreview}
                disabled={loading || !form.title || !form.message || form.targetRoles.length === 0}
                className="bg-brand-purple hover:bg-brand-purple/90"
              >
                <Eye size={14} className="mr-1" />
                {loading ? 'Loading…' : 'Preview'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all';

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}
