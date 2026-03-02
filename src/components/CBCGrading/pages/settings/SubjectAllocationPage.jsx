import React, { useState, useEffect, useCallback } from 'react';
import {
    UserPlus,
    Trash2,
    Search,
    BookOpen,
    User,
    ChevronRight,
    ChevronDown,
    GraduationCap,
    Plus,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Input,
    Badge,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../../../../components/ui';
import api from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const SubjectAllocationPage = () => {
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState([]);
    const [learningAreas, setLearningAreas] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGrades, setExpandedGrades] = useState({});
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { showSuccess, showError } = useNotifications();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [teachersResp, areasResp, assignmentsResp] = await Promise.all([
                api.teachers.getAll(),
                api.config.getLearningAreas(),
                api.subjectAssignments.getAll()
            ]);

            setTeachers(teachersResp.data || []);
            setLearningAreas(areasResp.data || []);
            setAssignments(assignmentsResp.data || []);

            // Expand the first grade by default
            if (areasResp.data && areasResp.data.length > 0) {
                setExpandedGrades({ [areasResp.data[0].gradeLevel]: true });
            }
        } catch (error) {
            console.error('Failed to fetch allocation data:', error);
            showError('Failed to load allocation data');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRemove = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to remove this assignment?')) return;

        try {
            await api.subjectAssignments.delete(assignmentId);
            showSuccess('Assignment removed successfully');
            setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        } catch (error) {
            showError('Failed to remove assignment');
        }
    };

    const handleAssign = async (teacherId) => {
        if (!selectedSubject || !teacherId) return;

        setSubmitting(true);
        try {
            const resp = await api.subjectAssignments.create({
                teacherId,
                learningAreaId: selectedSubject.id,
                grade: selectedSubject.gradeLevel
            });

            showSuccess('Teacher assigned successfully');
            setShowAssignModal(false);
            fetchData(); // Refresh to get the full joined data
        } catch (error) {
            showError(error.message || 'Failed to assign teacher');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleGrade = (grade) => {
        setExpandedGrades(prev => ({ ...prev, [grade]: !prev[grade] }));
    };

    // Group learning areas by grade level
    const groupedAreas = learningAreas.reduce((acc, area) => {
        if (!acc[area.gradeLevel]) acc[area.gradeLevel] = [];
        acc[area.gradeLevel].push(area);
        return acc;
    }, {});

    const filteredTeachers = teachers.filter(t =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.staffId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="text-lg font-medium">Loading allocations...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <GraduationCap className="text-purple-600" />
                        Subject Allocation
                    </h2>
                    <p className="text-sm text-gray-500">Assign teachers to subjects across different grades</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                    <BookOpen size={16} />
                    <span>{assignments.length} Assignments Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {Object.entries(groupedAreas).sort().map(([grade, areas]) => (
                    <Card key={grade} className="overflow-hidden border-gray-200 hover:border-purple-200 transition-all">
                        <div
                            className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${expandedGrades[grade] ? 'bg-purple-50/50' : 'hover:bg-gray-50'
                                }`}
                            onClick={() => toggleGrade(grade)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-purple-100 flex items-center justify-center text-purple-600">
                                    <GraduationCap size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 uppercase tracking-tight">{grade.replace(/_/g, ' ')}</h3>
                                    <p className="text-xs text-gray-500 font-medium">{areas.length} Learning Areas</p>
                                </div>
                            </div>
                            {expandedGrades[grade] ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                        </div>

                        {expandedGrades[grade] && (
                            <CardContent className="p-0 border-t border-gray-100">
                                <div className="divide-y divide-gray-100">
                                    {areas.sort((a, b) => a.name.localeCompare(b.name)).map(area => {
                                        const areaAssignments = assignments.filter(a => a.learningAreaId === area.id && a.grade === grade);

                                        return (
                                            <div key={area.id} className="p-4 hover:bg-gray-50/50 transition-colors group">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-purple-100 transition-colors">
                                                            <span className="text-sm">{area.icon || '📚'}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900">{area.name}</h4>
                                                            {area.description && <p className="text-xs text-gray-500 max-w-md">{area.description}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {areaAssignments.map(assign => (
                                                            <Badge
                                                                key={assign.id}
                                                                variant="secondary"
                                                                className="pl-1 pr-1 py-1 flex items-center gap-1 group/badge bg-white border-gray-200 hover:border-red-200 transition-all"
                                                            >
                                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-600">
                                                                    {assign.teacher?.firstName?.charAt(0)}{assign.teacher?.lastName?.charAt(0)}
                                                                </div>
                                                                <span className="text-xs font-semibold text-gray-700">
                                                                    {assign.teacher?.firstName} {assign.teacher?.lastName}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemove(assign.id);
                                                                    }}
                                                                    className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover/badge:opacity-100"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </Badge>
                                                        ))}

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 rounded-full border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 text-gray-600 hover:text-purple-700 gap-1 px-3"
                                                            onClick={() => {
                                                                setSelectedSubject(area);
                                                                setShowAssignModal(true);
                                                            }}
                                                        >
                                                            <UserPlus size={14} />
                                                            <span className="text-xs font-bold">Assign Tutor</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>

            {/* Assign Tutor Modal */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent className="max-w-md overflow-hidden p-0 rounded-2xl border-none shadow-2xl">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <UserPlus />
                                Assign Tutor
                            </DialogTitle>
                            <p className="text-purple-100 text-xs mt-1 font-medium opacity-90">
                                {selectedSubject?.name} • {selectedSubject?.gradeLevel.replace(/_/g, ' ')}
                            </p>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Search by name or staff ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {filteredTeachers.map(teacher => {
                                const isAlreadyAssigned = assignments.some(
                                    a => a.teacherId === teacher.id &&
                                        a.learningAreaId === selectedSubject?.id &&
                                        a.grade === selectedSubject?.gradeLevel
                                );

                                return (
                                    <div
                                        key={teacher.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isAlreadyAssigned
                                                ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                                                : 'border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 cursor-pointer'
                                            }`}
                                        onClick={() => !isAlreadyAssigned && handleAssign(teacher.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                                                {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{teacher.firstName} {teacher.lastName}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{teacher.staffId || 'Tutor'}</p>
                                            </div>
                                        </div>
                                        {isAlreadyAssigned ? (
                                            <CheckCircle2 className="text-green-500" size={20} />
                                        ) : (
                                            <ChevronRight className="text-gray-300" size={20} />
                                        )}
                                    </div>
                                );
                            })}

                            {filteredTeachers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">No results found for "{searchTerm}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="bg-gray-50 p-4 border-t border-gray-100">
                        <Button variant="ghost" onClick={() => setShowAssignModal(false)} className="rounded-xl font-bold">
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SubjectAllocationPage;
