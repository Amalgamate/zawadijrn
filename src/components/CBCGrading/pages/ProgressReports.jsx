/**
 * Progress Reports Component
 * View and generate LMS progress reports
 *
 * @component ProgressReports
 */

import React, { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Loader2, Download, Search, BarChart3, TrendingUp, Users, BookOpen, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProgressReports = () => {
    const { apiCall } = useApi();

    const [reports, setReports] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState('enrollment');
    const [courseFilter, setCourseFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCourses();
        generateReport();
    }, [reportType, courseFilter, dateFrom, dateTo]);

    const loadCourses = async () => {
        try {
            const response = await apiCall('/lms/courses?page=1&limit=100');
            setCourses(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to load courses:', error);
            setCourses([]);
        }
    };

    const generateReport = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                reportType,
                ...(courseFilter !== 'all' && { courseId: courseFilter }),
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo })
            });

            const response = await apiCall(`/lms/reports?${params}`);
            const reportData = response?.data?.reports || response?.data?.data || response?.data || [];
            setReports(Array.isArray(reportData) ? reportData : []);
        } catch (error) {
            console.error('Failed to generate report:', error);
            setReports([]);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const exportReport = () => {
        // Create CSV content
        let csvContent = '';

        if (reportType === 'enrollment') {
            csvContent = 'Learner Name,Admission Number,Course,Subject,Status,Enrolled Date\n';
            reports.forEach(report => {
                csvContent += `${report.learner.firstName} ${report.learner.lastName},${report.learner.admissionNumber},${report.course.title},${report.course.subject},${report.status},${new Date(report.enrolledAt).toLocaleDateString()}\n`;
            });
        } else if (reportType === 'progress') {
            csvContent = 'Learner Name,Course,Content,Progress,Completed,Time Spent,Last Accessed\n';
            reports.forEach(report => {
                const enrollment = report.enrollment;
                const learner = enrollment.learner;
                const course = enrollment.course;
                const content = report.content;
                csvContent += `${learner.firstName} ${learner.lastName},${course.title},${content.title},${report.progress}%,${report.completed ? 'Yes' : 'No'},${report.timeSpent}s,${new Date(report.lastAccessedAt).toLocaleDateString()}\n`;
            });
        }

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lms-${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredReports = Array.isArray(reports) ? reports.filter(report => {
        if (!searchTerm) return true;

        if (reportType === 'enrollment') {
            const learnerName = `${report.learner.firstName} ${report.learner.lastName}`.toLowerCase();
            const courseName = report.course.title.toLowerCase();
            return learnerName.includes(searchTerm.toLowerCase()) || courseName.includes(searchTerm.toLowerCase());
        } else if (reportType === 'progress') {
            const learnerName = `${report.enrollment.learner.firstName} ${report.enrollment.learner.lastName}`.toLowerCase();
            const courseName = report.enrollment.course.title.toLowerCase();
            const contentName = report.content.title.toLowerCase();
            return learnerName.includes(searchTerm.toLowerCase()) ||
                   courseName.includes(searchTerm.toLowerCase()) ||
                   contentName.includes(searchTerm.toLowerCase());
        }

        return true;
    }) : [];

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'ACTIVE': return 'default';
            case 'COMPLETED': return 'secondary';
            case 'INACTIVE': return 'outline';
            case 'DROPPED': return 'destructive';
            default: return 'secondary';
        }
    };

    const formatTimeSpent = (seconds) => {
        if (!seconds) return '0s';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Progress Reports</h2>
                    <p className="text-gray-600">Generate and view learning progress reports</p>
                </div>
                <Button
                    onClick={exportReport}
                    className="flex items-center gap-2"
                    disabled={reports.length === 0}
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Report Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Report Type
                            </label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="enrollment">Enrollment Report</SelectItem>
                                    <SelectItem value="progress">Progress Report</SelectItem>
                                    <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Course
                            </label>
                            <Select value={courseFilter} onValueChange={setCourseFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                From Date
                            </label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Date
                            </label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search reports..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button onClick={generateReport} disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Generate Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Report Summary */}
            {!loading && reports.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Users className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                                    <p className="text-2xl font-bold text-gray-900">{filteredReports.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {reportType === 'enrollment' && (
                        <>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="h-8 w-8 text-green-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Active Enrollments</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {filteredReports.filter(r => r.status === 'ACTIVE').length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="h-8 w-8 text-purple-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Completed Courses</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {filteredReports.filter(r => r.status === 'COMPLETED').length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {reportType === 'progress' && (
                        <>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <BarChart3 className="h-8 w-8 text-green-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {Math.round(filteredReports.reduce((acc, r) => acc + r.progress, 0) / filteredReports.length)}%
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-8 w-8 text-blue-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Completed Items</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {filteredReports.filter(r => r.completed).length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            )}

            {/* Report Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {reportType === 'enrollment' ? 'Enrollment Report' :
                         reportType === 'progress' ? 'Progress Report' : 'Comprehensive Report'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="text-center py-12">
                            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No report data found</h3>
                            <p className="text-gray-500">Try adjusting your filters or generate a new report.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {reportType === 'enrollment' ? (
                                            <>
                                                <TableHead>Learner</TableHead>
                                                <TableHead>Admission No.</TableHead>
                                                <TableHead>Course</TableHead>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Enrolled Date</TableHead>
                                            </>
                                        ) : reportType === 'progress' ? (
                                            <>
                                                <TableHead>Learner</TableHead>
                                                <TableHead>Course</TableHead>
                                                <TableHead>Content</TableHead>
                                                <TableHead>Progress</TableHead>
                                                <TableHead>Completed</TableHead>
                                                <TableHead>Time Spent</TableHead>
                                                <TableHead>Last Accessed</TableHead>
                                            </>
                                        ) : (
                                            <>
                                                <TableHead>Learner</TableHead>
                                                <TableHead>Course</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Progress</TableHead>
                                                <TableHead>Enrolled Date</TableHead>
                                            </>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReports.map((report, index) => (
                                        <TableRow key={index}>
                                            {reportType === 'enrollment' ? (
                                                <>
                                                    <TableCell>
                                                        {report.learner.firstName} {report.learner.lastName}
                                                    </TableCell>
                                                    <TableCell>{report.learner.admissionNumber}</TableCell>
                                                    <TableCell>{report.course.title}</TableCell>
                                                    <TableCell>{report.course.subject}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusBadgeVariant(report.status)}>
                                                            {report.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(report.enrolledAt).toLocaleDateString()}
                                                    </TableCell>
                                                </>
                                            ) : reportType === 'progress' ? (
                                                <>
                                                    <TableCell>
                                                        {report.enrollment.learner.firstName} {report.enrollment.learner.lastName}
                                                    </TableCell>
                                                    <TableCell>{report.enrollment.course.title}</TableCell>
                                                    <TableCell>{report.content.title}</TableCell>
                                                    <TableCell>{report.progress}%</TableCell>
                                                    <TableCell>
                                                        <Badge variant={report.completed ? 'default' : 'secondary'}>
                                                            {report.completed ? 'Yes' : 'No'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{formatTimeSpent(report.timeSpent)}</TableCell>
                                                    <TableCell>
                                                        {new Date(report.lastAccessedAt).toLocaleDateString()}
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell>
                                                        {report.learner.firstName} {report.learner.lastName}
                                                    </TableCell>
                                                    <TableCell>{report.course.title}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusBadgeVariant(report.status)}>
                                                            {report.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {report.progress ? `${report.progress.reduce((acc, p) => acc + p.progress, 0) / report.progress.length}%` : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(report.enrolledAt).toLocaleDateString()}
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ProgressReports;