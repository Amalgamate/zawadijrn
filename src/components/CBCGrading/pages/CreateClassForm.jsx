/**
 * CreateClassForm Component
 * Form to create new classes with:
 * - Grade select dropdown (fetches all available grades)
 * - Teacher select dropdown
 * - Auto-generated class code (system generates)
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Loader } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../../../components/ui';
import { GRADES } from '../../../constants/grades';
import { useAuth } from '../../../hooks/useAuth';
import { getAdminSchoolId, getStoredUser } from '../../../services/tenantContext';
import * as classAPI from '../../../services/classAPI';
import usePageNavigation from '../../../hooks/usePageNavigation';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const CreateClassForm = () => {
  const navigateTo = usePageNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [schoolId, setSchoolId] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    grade: 'GRADE_1',
    stream: 'A',
    branchId: '',
    teacherId: '',
    capacity: 40,
    room: '',
    academicYear: new Date().getFullYear(),
    term: 'TERM_1'
  });

  useEffect(() => {
    let sid = getAdminSchoolId();
    if (!sid) {
      const storedUser = getStoredUser();
      sid = storedUser?.schoolId || user?.schoolId;
    }
    setSchoolId(sid);

    if (sid) {
      fetchInitialData(sid);
    }
  }, [user]);

  const fetchInitialData = async (sid) => {
    try {
      // Fetch teachers for this school
      const teachersResponse = await api.teachers.getAll({ schoolId: sid });
      setTeachers(Array.isArray(teachersResponse) ? teachersResponse : teachersResponse?.data || []);

      // Fetch branches for this school
      const branchesResponse = await api.admin.getBranches(sid);
      const branchesData = Array.isArray(branchesResponse) ? branchesResponse : branchesResponse?.data || [];
      setBranches(branchesData);

      // Set default branch if only one exists
      if (branchesData.length === 1) {
        setFormData(prev => ({ ...prev, branchId: branchesData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load form data');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' || name === 'academicYear' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.grade || !formData.branchId) {
        throw new Error('Please fill in all required fields');
      }

      // Auto-generate name if not provided
      const finalName = formData.name || `${formData.grade.replace('_', ' ')} ${formData.stream}`;

      // Call API to create class
      const response = await classAPI.createClass({
        ...formData,
        name: finalName
      });

      toast.success('Class created successfully!');
      navigateTo('classes');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to create class';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => navigateTo('classes')} variant="ghost" size="sm">
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Create New Class</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new class to your school. Class code will be auto-generated.</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900">Error</p>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Grade & Stream */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Grade *
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                >
                  <option value="">Select Grade</option>
                  {GRADES.map(grade => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Stream
                </label>
                <select
                  name="stream"
                  value={formData.stream}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                >
                  <option value="A">Stream A</option>
                  <option value="B">Stream B</option>
                  <option value="C">Stream C</option>
                </select>
              </div>
            </div>

            {/* Class Name & Room */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Class Name (Optional)
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Grade 5 Alpha"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to auto-generate</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Room/Location
                </label>
                <Input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="e.g., Room 301"
                  className="w-full"
                />
              </div>
            </div>

            {/* Branch & Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Branch/Campus *
                </label>
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Capacity
                </label>
                <Input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  className="w-full"
                />
              </div>
            </div>

            {/* Teacher Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Class Teacher (Optional)
              </label>
              <select
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
              >
                <option value="">-- Assign Later --</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Can be assigned or changed later</p>
            </div>

            {/* Academic Context */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Academic Year
                </label>
                <Input
                  type="number"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Term
                </label>
                <select
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                >
                  <option value="TERM_1">Term 1</option>
                  <option value="TERM_2">Term 2</option>
                  <option value="TERM_3">Term 3</option>
                </select>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Class Code:</strong> Will be auto-generated by the system (e.g., CLS-00001)
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigateTo('classes')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-brand-purple hover:bg-brand-purple/90"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Class'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateClassForm;
