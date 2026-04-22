/**
 * BookCatalog.jsx — Library Phase 1 Frontend
 *
 * Full book catalog page: search, filter, add/edit/delete books,
 * manage copies per book.
 *
 * API: libraryAPI (book.api.js) — /api/library/books + /copies
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen, Plus, Search, Filter, X, Edit2, Trash2,
  ChevronDown, ChevronUp, Package, Tag, Hash,
  AlertTriangle, CheckCircle, Loader2, RefreshCw, BookCopy
} from 'lucide-react';
import { libraryAPI } from '../../../../services/api/book.api';
import toast from 'react-hot-toast';

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    AVAILABLE:    'bg-emerald-100 text-emerald-700 border-emerald-200',
    LIMITED:      'bg-amber-100 text-amber-700 border-amber-200',
    OUT_OF_STOCK: 'bg-red-100 text-red-700 border-red-200',
    DISCONTINUED: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  const label = { AVAILABLE: 'Available', LIMITED: 'Limited', OUT_OF_STOCK: 'Out of Stock', DISCONTINUED: 'Discontinued' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${map[status] || map.AVAILABLE}`}>
      {label[status] || status}
    </span>
  );
};

// ─── Book Form Modal ──────────────────────────────────────────────────────────
const BookFormModal = ({ book, onClose, onSaved }) => {
  const isEdit = !!book;
  const [form, setForm] = useState({
    title: book?.title || '',
    author: book?.author || '',
    isbn: book?.isbn || '',
    publisher: book?.publisher || '',
    publicationYear: book?.publicationYear || '',
    category: book?.category || '',
    description: book?.description || '',
    language: book?.language || 'English',
    pages: book?.pages || '',
    edition: book?.edition || '',
    totalCopies: book?.totalCopies || 1,
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        publicationYear: form.publicationYear ? parseInt(form.publicationYear) : undefined,
        pages: form.pages ? parseInt(form.pages) : undefined,
        totalCopies: parseInt(form.totalCopies) || 1,
      };
      if (isEdit) {
        await libraryAPI.updateBook(book.id, payload);
        toast.success('Book updated');
      } else {
        await libraryAPI.createBook(payload);
        toast.success('Book added to catalog');
      }
      onSaved();
    } catch (err) {
      toast.error(err?.message || 'Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', span = 1 }) => (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => set(name, e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-medium text-slate-900">{isEdit ? 'Edit Book' : 'Add New Book'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title *" name="title" span={2} />
            <Field label="Author" name="author" />
            <Field label="ISBN" name="isbn" />
            <Field label="Publisher" name="publisher" />
            <Field label="Publication Year" name="publicationYear" type="number" />
            <Field label="Category" name="category" />
            <Field label="Language" name="language" />
            <Field label="Edition" name="edition" />
            <Field label="Pages" name="pages" type="number" />
            {!isEdit && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Number of Copies</label>
                <input
                  type="number"
                  min="1"
                  value={form.totalCopies}
                  onChange={e => set('totalCopies', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Copies Drawer ────────────────────────────────────────────────────────────
const CopiesDrawer = ({ book, onClose }) => {
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingCopy, setAddingCopy] = useState(false);

  const loadCopies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await libraryAPI.getBookCopies(book.id);
      setCopies(res?.data || []);
    } catch {
      toast.error('Failed to load copies');
    } finally {
      setLoading(false);
    }
  }, [book.id]);

  useEffect(() => { loadCopies(); }, [loadCopies]);

  const handleAddCopy = async () => {
    setAddingCopy(true);
    try {
      await libraryAPI.createBookCopy(book.id, { condition: 'GOOD' });
      toast.success('Copy added');
      loadCopies();
    } catch (err) {
      toast.error(err?.message || 'Failed to add copy');
    } finally {
      setAddingCopy(false);
    }
  };

  const handleDeleteCopy = async (copyId) => {
    if (!window.confirm('Delete this copy?')) return;
    try {
      await libraryAPI.deleteBookCopy(copyId);
      toast.success('Copy deleted');
      loadCopies();
    } catch (err) {
      toast.error(err?.message || 'Cannot delete — copy may have active loans');
    }
  };

  const copyStatusColor = {
    AVAILABLE: 'text-emerald-600 bg-emerald-50',
    BORROWED:  'text-blue-600 bg-blue-50',
    RESERVED:  'text-amber-600 bg-amber-50',
    DAMAGED:   'text-red-600 bg-red-50',
    LOST:      'text-slate-400 bg-slate-50',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-sm">
      <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-medium text-slate-900">{book.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Copies ({copies.length})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-violet-500" /></div>
          ) : copies.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No copies registered yet.</div>
          ) : (
            copies.map(copy => (
              <div key={copy.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 font-mono">{copy.copyNumber}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full ${copyStatusColor[copy.status] || copyStatusColor.AVAILABLE}`}>
                      {copy.status}
                    </span>
                    <span className="text-[10px] text-slate-400">{copy.condition}</span>
                    {copy.location && <span className="text-[10px] text-slate-400">📍 {copy.location}</span>}
                  </div>
                </div>
                <button onClick={() => handleDeleteCopy(copy.id)}
                  className="ml-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleAddCopy} disabled={addingCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60">
            {addingCopy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Add Copy
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const BookCatalog = () => {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [copiesBook, setCopiesBook] = useState(null);
  const [categories, setCategories] = useState([]);
  const searchTimeout = useRef(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await libraryAPI.getBooks({ search, category, status: statusFilter, page, limit: 20 });
      const data = res?.data || [];
      setBooks(data);
      setPagination(res?.pagination || { total: data.length, page: 1, pages: 1 });
      // Extract unique categories
      const cats = [...new Set(data.map(b => b.category).filter(Boolean))];
      if (cats.length) setCategories(prev => [...new Set([...prev, ...cats])]);
    } catch {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  }, [search, category, statusFilter]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => load(1), 350);
    return () => clearTimeout(searchTimeout.current);
  }, [load]);

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    try {
      await libraryAPI.deleteBook(book.id);
      toast.success('Book deleted');
      load(pagination.page);
    } catch (err) {
      toast.error(err?.message || 'Cannot delete — book may have active loans');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditingBook(null);
    load(1);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">Book Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">{pagination.total} title{pagination.total !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => { setEditingBook(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200">
          <Plus size={16} />
          Add Book
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by title, author or ISBN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 bg-white min-w-[140px]">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 bg-white min-w-[140px]">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="LIMITED">Limited</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
        {(search || category || statusFilter) && (
          <button onClick={() => { setSearch(''); setCategory(''); setStatusFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-violet-500" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <BookOpen size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No books found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or add a new book.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Title / Author</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">ISBN / Category</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Copies</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {books.map(book => (
                  <tr key={book.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 leading-tight">{book.title}</p>
                      {book.author && <p className="text-xs text-slate-400 mt-0.5">{book.author}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-slate-500 font-mono">{book.isbn || '—'}</p>
                      {book.category && (
                        <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full font-medium">
                          <Tag size={9} />{book.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setCopiesBook(book)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 text-xs font-semibold transition-colors">
                        <BookCopy size={12} />
                        <span>{book.availableCopies}/{book.totalCopies}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={book.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => { setEditingBook(book); setShowModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(book)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
                <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Prev</button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showModal && (
        <BookFormModal
          book={editingBook}
          onClose={() => { setShowModal(false); setEditingBook(null); }}
          onSaved={handleSaved}
        />
      )}
      {copiesBook && <CopiesDrawer book={copiesBook} onClose={() => setCopiesBook(null)} />}
    </div>
  );
};

export default BookCatalog;
