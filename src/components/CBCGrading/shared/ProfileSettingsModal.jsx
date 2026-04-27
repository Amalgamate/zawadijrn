import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, Save, User } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { userAPI, documentsAPI } from '../../../services/api';
import { useNotifications } from '../hooks/useNotifications';
import UserAvatar from './UserAvatar';

const ProfileSettingsModal = ({ isOpen, onClose, user, onUpdate }) => {
  const { showSuccess, showError } = useNotifications();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    profileImage: user?.profileImage || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (e.g., 2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      showError('Image must be less than 2MB');
      return;
    }

    try {
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('category', 'AVATAR');

      const response = await documentsAPI.upload(uploadData);
      if (response.success && response.data?.url) {
        setFormData(prev => ({ ...prev, profileImage: response.data.url }));
        showSuccess('Profile picture uploaded!');
      } else {
        showError('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showError('Names cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.update(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        profileImage: formData.profileImage
      });

      if (response.success) {
        showSuccess('Profile updated successfully!');
        onUpdate?.({
          firstName: formData.firstName,
          lastName: formData.lastName,
          name: `${formData.firstName} ${formData.lastName}`,
          profileImage: formData.profileImage
        });
        onClose();
      } else {
        showError(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      showError('An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Profile Settings</h2>
            <p className="text-[13px] text-slate-500">Update your personal information</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <UserAvatar 
                name={`${formData.firstName} ${formData.lastName}`} 
                imageUrl={formData.profileImage}
                size="xl"
                className="ring-4 ring-white shadow-xl"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-brand-purple text-white shadow-lg border-2 border-white transition-all active:scale-90 hover:bg-brand-purple/90 group-hover:scale-110"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <p className="mt-3 text-[12px] font-medium text-slate-400">Click camera to change photo</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">First Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First Name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple outline-none transition"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Last Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last Name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple outline-none transition"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full py-3.5 bg-brand-purple text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-100 hover:bg-brand-purple/90 active:scale-[0.98] transition disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {loading ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
