/**
 * Add/Edit Teacher Page
 * Full page form for adding or editing teacher/tutor information
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Mail, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const AddEditTeacherPage = ({ onSave, onCancel, teacher = null }) => {
    const isEdit = !!teacher;
    const { showSuccess, showError } = useNotifications();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phone: '',
        password: '',
        gender: '',
        subject: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (teacher) {
            setFormData({
                firstName: teacher.firstName || '',
                lastName: teacher.lastName || '',
                middleName: teacher.middleName || '',
                email: teacher.email || '',
                phone: teacher.phone || '',
                gender: teacher.gender || '',
                subject: teacher.subject || '',
                password: '' // Don't populate password for edits
            });
        }
    }, [teacher]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

        // Password is only required for new teachers
        if (!isEdit && !formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password && formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            showError('Please check the form for errors');
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare data for API
            const teacherData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName,
                email: formData.email,
                phone: formData.phone,
                gender: formData.gender,
                subject: formData.subject
            };

            // Only include password if it's provided
            if (formData.password) {
                teacherData.password = formData.password;
            }

            await onSave(teacherData);
            // Success notification should be handled by the parent or useTeachers hook,
            // but we can show one here if ensuring logic flow
        } catch (error) {
            console.error('Error submitting form:', error);
            showError('Failed to save teacher details');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onCancel}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEdit ? 'Edit Tutor Details' : 'Add New Tutor'}
                    </h1>
                    <p className="text-gray-500">
                        {isEdit ? 'Update existing tutor information' : 'Create a new tutor account with access privileges'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <User size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple transition ${errors.firstName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                                placeholder="Enter first name"
                            />
                            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Middle Name
                            </label>
                            <input
                                type="text"
                                name="middleName"
                                value={formData.middleName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple transition"
                                placeholder="Enter middle name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple transition ${errors.lastName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                                placeholder="Enter last name"
                            />
                            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Gender
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple transition"
                            >
                                <option value="">Select Gender</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <Mail size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Contact Information</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isEdit}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple transition ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'} ${isEdit ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
                                placeholder="email@example.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            {isEdit && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> Email cannot be changed</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple transition ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                                placeholder="Enter phone number"
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Teaching Subject
                            </label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple transition"
                                placeholder="e.g. Mathematics, Science"
                            />
                        </div>
                    </div>
                </div>

                {/* Account Security */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <BookOpen size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Account Security</h3>
                    </div>
                    <div className="p-6">
                        <div className="max-w-md">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password {!isEdit && <span className="text-red-500">*</span>}
                                {isEdit && <span className="text-gray-500 text-xs ml-2 font-normal">(Leave empty to keep current password)</span>}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-purple transition ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                                placeholder={isEdit ? "Enter new password (optional)" : "Enter password (min 8 characters)"}
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            {!isEdit && <p className="text-xs text-gray-500 mt-1">Minimum 8 characters required</p>}
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                            <div className="mt-0.5">
                                <CheckCircle size={16} className="text-blue-600" />
                            </div>
                            <p className="text-sm text-blue-800">
                                The tutor will be created with the role "TEACHER" and can access the system using their email and password.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-8 py-2.5 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition font-semibold shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {isEdit ? 'Update Tutor' : 'Add Tutor'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEditTeacherPage;
