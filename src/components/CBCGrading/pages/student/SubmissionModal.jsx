/**
 * SubmissionModal — Student assignment submission modal
 */
import React, { useState } from 'react';
import { X, Send, Loader, CheckCircle } from 'lucide-react';
import axiosInstance from '../../../../services/api/axiosConfig';

const SubmissionModal = ({ assignment, onClose, onSubmitted }) => {
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim() && !fileUrl.trim()) {
      setError('Please write your answer or provide a file URL before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await axiosInstance.post(`/lms/assignments/${assignment.id}/submit`, { content, fileUrl });
      setDone(true);
      setTimeout(() => { onSubmitted?.(); onClose(); }, 1800);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Submit Assignment</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{assignment.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" />
            <p className="text-base font-semibold text-gray-900">Submitted!</p>
            <p className="text-sm text-gray-500 mt-1">Your work has been sent to your teacher.</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Assignment info */}
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-500 uppercase tracking-wider">Course</span>
                <span className="font-medium text-gray-800">{assignment.course?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500 uppercase tracking-wider">Points</span>
                <span className="font-medium text-gray-800">{assignment.totalPoints}</span>
              </div>
              {assignment.dueDate && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 uppercase tracking-wider">Due</span>
                  <span className="font-medium text-gray-800">
                    {new Date(assignment.dueDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Written answer */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Your Answer
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your answer here…"
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
              />
            </div>

            {/* File URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                File URL <span className="normal-case font-medium text-gray-400">(optional — Google Drive, OneDrive, etc.)</span>
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={e => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          </div>
        )}

        {!done && (
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionModal;
