/**
 * WhatsApp Notification Tester
 * Simple page to test WhatsApp notifications
 */

import React, { useState } from 'react';
import { Send, Users, Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';

const WhatsAppTester = () => {
  const { showSuccess } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [selectedLearner, setSelectedLearner] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  // Test basic WhatsApp connection
  const handleTestConnection = async () => {
    if (!testPhone || testPhone === '+254') {
      showSuccess('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await api.notifications.testWhatsApp(testPhone);
      if (result.success) {
        showSuccess('✅ Test message sent successfully! Check WhatsApp.');
      } else {
        showSuccess('❌ Failed: ' + (result.error || result.message));
      }
    } catch (error) {
      showSuccess('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Send assessment notification
  const handleSendAssessmentNotification = async () => {
    if (!selectedLearner) {
      showSuccess('Please select a student');
      return;
    }

    setLoading(true);
    try {
      const result = await api.notifications.sendAssessmentNotification({
        learnerId: selectedLearner,
        assessmentType: 'Formative',
        subject: 'Mathematics',
        grade: 'Grade 4',
        term: 'Term 1 2026'
      });

      if (result.success) {
        showSuccess('✅ Parent notified successfully via WhatsApp!');
      } else {
        showSuccess('❌ Failed: ' + result.message);
      }
    } catch (error) {
      showSuccess('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Send announcement
  const handleSendAnnouncement = async () => {
    if (!announcementTitle || !announcementContent) {
      showSuccess('Please enter title and content');
      return;
    }

    setLoading(true);
    try {
      const result = await api.notifications.sendAnnouncement({
        title: announcementTitle,
        content: announcementContent,
        grade: 'Grade 4', // Optional: remove for all parents
      });

      if (result.success) {
        showSuccess(`✅ Announcement sent to ${result.data.sent} parents!`);
        setAnnouncementTitle('');
        setAnnouncementContent('');
      } else {
        showSuccess('❌ Failed: ' + result.message);
      }
    } catch (error) {
      showSuccess('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Test Connection */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Send className="text-green-600" size={24} />
          <h3 className="text-xl font-bold">Test Connection</h3>
        </div>
        <p className="text-gray-600 mb-4">Send a test message to verify WhatsApp integration is working.</p>

        <div className="flex gap-3">
          <input
            type="text"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+254712345678"
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={handleTestConnection}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send Test'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Enter phone number in format: +254712345678 or 0712345678
        </p>
      </div>

      {/* Assessment Notification */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold">Assessment Notification</h3>
        </div>
        <p className="text-gray-600 mb-4">Simulate sending assessment completion notification to a parent.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-2">Select Student</label>
            <select
              value={selectedLearner}
              onChange={(e) => setSelectedLearner(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">-- Select a student --</option>
              <option value="student-1">John Doe (Grade 4A)</option>
              <option value="student-2">Jane Smith (Grade 4B)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Note: This is a demo. Use actual student IDs from your database.
            </p>
          </div>

          <button
            onClick={handleSendAssessmentNotification}
            disabled={loading || !selectedLearner}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
          >
            {loading ? 'Sending...' : 'Send Assessment Notification'}
          </button>
        </div>
      </div>

      {/* School Announcement */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-purple-600" size={24} />
          <h3 className="text-xl font-bold">School Announcement</h3>
        </div>
        <p className="text-gray-600 mb-4">Send announcement to all parents or filtered by grade.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-2">Announcement Title</label>
            <input
              type="text"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="e.g., School Closure Notice"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Message Content</label>
            <textarea
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              placeholder="Enter your announcement message..."
              rows="4"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <button
            onClick={handleSendAnnouncement}
            disabled={loading || !announcementTitle || !announcementContent}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold"
          >
            {loading ? 'Sending...' : 'Send to Grade 4 Parents'}
          </button>
          <p className="text-xs text-gray-500">
            This will send to all parents of Grade 4 students. Remove grade filter in code to send to all parents.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-bold text-blue-900 mb-3">Setup Instructions:</h4>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Configure Africa's Talking API key in server/.env file</li>
          <li>Restart backend server: <code className="bg-blue-100 px-2 py-1 rounded">npm run dev</code></li>
          <li>Ensure students have parent phone numbers in database</li>
          <li>Test with the buttons above</li>
        </ol>

        <div className="mt-4 p-3 bg-white rounded border border-blue-200">
          <p className="font-semibold text-blue-900 mb-1">Sandbox Mode (Testing):</p>
          <p className="text-sm text-blue-800">
            If API key is not configured, messages will be simulated and logged to console.
            Check your server terminal for "SIMULATED MESSAGE" logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTester;

