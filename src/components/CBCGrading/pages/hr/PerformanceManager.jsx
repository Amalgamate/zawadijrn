import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Plus, Edit2, Trash2,
    Award, Target, TrendingUp, User,
    Calendar, Star, MessageSquare, ChevronRight,
    CheckCircle2, AlertCircle, X, Save
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { toInputDate } from '../../utils/dateHelpers';

const PerformanceManager = () => {
    const [reviews, setReviews] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [formData, setFormData] = useState({
        userId: '',
        periodStart: '',
        periodEnd: '',
        technicalRating: 3,
        behavioralRating: 3,
        collaborationRating: 3,
        comments: '',
        goals: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reviewsRes, staffRes] = await Promise.all([
                hrAPI.getPerformanceReviews(),
                hrAPI.getStaffDirectory()
            ]);
            if (reviewsRes.success) setReviews(reviewsRes.data);
            if (staffRes.success) setStaff(staffRes.data);
        } catch (error) {
            console.error('Error fetching performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const overallRating = (formData.technicalRating + formData.behavioralRating + formData.collaborationRating) / 3;
            const dataToSave = { ...formData, overallRating };

            let res;
            if (selectedReview) {
                res = await hrAPI.updatePerformanceReview(selectedReview.id, dataToSave);
            } else {
                res = await hrAPI.createPerformanceReview(dataToSave);
            }

            if (res.success) {
                fetchData();
                setShowModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error saving review:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            userId: '',
            periodStart: '',
            periodEnd: '',
            technicalRating: 3,
            behavioralRating: 3,
            collaborationRating: 3,
            comments: '',
            goals: []
        });
        setSelectedReview(null);
    };

    const addGoal = () => {
        setFormData({
            ...formData,
            goals: [...formData.goals, { id: Date.now(), text: '', status: 'PENDING' }]
        });
    };

    const updateGoal = (id, text) => {
        setFormData({
            ...formData,
            goals: formData.goals.map(g => g.id === id ? { ...g, text } : g)
        });
    };

    const removeGoal = (id) => {
        setFormData({
            ...formData,
            goals: formData.goals.filter(g => g.id !== id)
        });
    };

    const RatingStars = ({ rating, onChange }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange && onChange(star)}
                        className={`p-1 transition-all ${star <= rating ? 'text-amber-400 scale-110' : 'text-gray-200 hover:text-amber-200'}`}
                    >
                        <Star size={20} fill={star <= rating ? 'currentColor' : 'none'} />
                    </button>
                ))}
            </div>
        );
    };

    const filteredReviews = reviews.filter(rev =>
        (rev.user.firstName + ' ' + rev.user.lastName).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
                    <p className="text-gray-500">Track staff evaluations, KRAs, and professional growth.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-xl hover:bg-brand-teal/90 transition-all font-bold shadow-lg shadow-brand-teal/20"
                >
                    <Plus size={18} />
                    New Evaluation
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-purple p-6 rounded-2xl shadow-sm text-white relative overflow-hidden group">
                    <Award className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-lg font-medium opacity-80">Average Performance</h3>
                    <p className="text-3xl font-bold mt-2">4.2 / 5.0</p>
                    <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 w-fit px-2 py-1 rounded-lg">
                        <TrendingUp size={14} />
                        <span>+0.3 from last term</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <Target size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Goal Completion</h3>
                        <p className="text-2xl font-bold text-gray-900">78%</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Reviews Completed</h3>
                        <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Filter by staff name..."
                        className="w-full pl-10 pr-4 py-2 border-none bg-transparent focus:ring-0 text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="h-8 w-px bg-gray-100" />
                <button className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-brand-teal transition-colors font-medium">
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            {/* Review List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl" />
                    ))
                ) : filteredReviews.map((review) => (
                    <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center font-bold text-brand-teal">
                                    {review.user.firstName[0]}{review.user.lastName[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{review.user.firstName} {review.user.lastName}</h4>
                                    <p className="text-xs text-gray-500">{review.user.role.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-amber-500 font-bold text-lg">
                                    <Star size={18} fill="currentColor" />
                                    {Number(review.overallRating).toFixed(1)}
                                </div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Overall Score</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-gray-50 p-2 rounded-xl text-center">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Technical</p>
                                <p className="font-bold text-gray-900">{review.technicalRating}/5</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl text-center">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Behavior</p>
                                <p className="font-bold text-gray-900">{review.behavioralRating}/5</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl text-center">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Collab</p>
                                <p className="font-bold text-gray-900">{review.collaborationRating}/5</p>
                            </div>
                        </div>

                        {review.comments && (
                            <div className="flex gap-2 text-sm text-gray-600 mb-4 line-clamp-2 italic">
                                <MessageSquare size={16} className="shrink-0 text-gray-400 mt-1" />
                                "{review.comments}"
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar size={14} />
                                {new Date(review.reviewDate).toLocaleDateString()}
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedReview(review);
                                    setFormData({
                                        userId: review.userId,
                                        periodStart: toInputDate(review.periodStart),
                                        periodEnd: toInputDate(review.periodEnd),
                                        technicalRating: review.technicalRating,
                                        behavioralRating: review.behavioralRating,
                                        collaborationRating: review.collaborationRating,
                                        comments: review.comments,
                                        goals: review.goals || []
                                    });
                                    setShowModal(true);
                                }}
                                className="text-brand-teal hover:underline text-sm font-bold flex items-center gap-1"
                            >
                                Details <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* New Evaluation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {selectedReview ? 'Update Performance Review' : 'Create Performance Review'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Staff Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <User size={16} /> Select Staff Member
                                </label>
                                <select
                                    required
                                    disabled={selectedReview}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 transition-all outline-none"
                                    value={formData.userId}
                                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                >
                                    <option value="">Select an employee...</option>
                                    {staff.map(s => (
                                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role.replace('_', ' ')})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Period Start</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal/20"
                                        value={toInputDate(formData.periodStart)}
                                        onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Period End</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal/20"
                                        value={toInputDate(formData.periodEnd)}
                                        onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-2">Performance Metrics</h3>
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl">
                                    <span className="text-sm font-medium text-gray-700">Technical Skills</span>
                                    <RatingStars
                                        rating={formData.technicalRating}
                                        onChange={(v) => setFormData({ ...formData, technicalRating: v })}
                                    />
                                </div>
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl">
                                    <span className="text-sm font-medium text-gray-700">Behavioral Compliance</span>
                                    <RatingStars
                                        rating={formData.behavioralRating}
                                        onChange={(v) => setFormData({ ...formData, behavioralRating: v })}
                                    />
                                </div>
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl">
                                    <span className="text-sm font-medium text-gray-700">Collaboration & Teamwork</span>
                                    <RatingStars
                                        rating={formData.collaborationRating}
                                        onChange={(v) => setFormData({ ...formData, collaborationRating: v })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">KRAs & Goals</label>
                                <div className="space-y-3">
                                    {formData.goals.map((goal) => (
                                        <div key={goal.id} className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal/20"
                                                placeholder="Describe goal or KRA..."
                                                value={goal.text}
                                                onChange={(e) => updateGoal(goal.id, e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeGoal(goal.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addGoal}
                                        className="text-brand-teal text-sm font-bold flex items-center gap-1 hover:underline"
                                    >
                                        <Plus size={16} /> Add Goal
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Review Comments</label>
                                <textarea
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal/20 min-h-[100px]"
                                    placeholder="Provide detailed feedback on performance..."
                                    value={formData.comments}
                                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                />
                            </div>
                        </form>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 bg-brand-teal text-white rounded-2xl font-bold hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {selectedReview ? 'Update Review' : 'Save Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceManager;
