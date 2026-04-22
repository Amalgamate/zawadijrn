import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Reply, X, Users, Send, CheckCircle, AlertCircle, Loader2, RefreshCw, MessageSquare, Phone, Bell, Upload } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '../../../components/ui';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';
import { formatPhoneNumber, isValidPhoneNumber, getDisplayPhoneNumber } from '../../../utils/phoneFormatter';
import BroadcastMessagesPage from './BroadcastMessagesPage';
import { useSchoolData } from '../../../contexts/SchoolDataContext';

const MessagesPage = () => {
  // Debug logging
  React.useEffect(() => {
    console.log('✅ MessagesPage component mounted');
    console.log('📝 Test message feature loaded and ready');
  }, []);

  const { showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'broadcast'

  // Inbox & Compose State
  const [showCompose, setShowCompose] = useState(false);
  const [composeInputMode, setComposeInputMode] = useState('single'); // 'single' or 'bulk'
  const [composePhone, setComposePhone] = useState('');
  const [composePhones, setComposePhones] = useState([]); // For bulk/CSV
  const [composeCsvFile, setComposeCsvFile] = useState(null);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [isSendingCompose, setIsSendingCompose] = useState(false);
  const [composeSendReport, setComposeSendReport] = useState([]);
  const [composeScheduledFor, setComposeScheduledFor] = useState('');
  const [inboxMessages, setInboxMessages] = useState([]);
  const [showComposeReport, setShowComposeReport] = useState(false);

  // Staff Directory State
  const [staffContacts, setStaffContacts] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffFilter, setStaffFilter] = useState('');

  const filteredStaff = staffContacts.filter(staff => 
    staff.name.toLowerCase().includes(staffFilter.toLowerCase()) ||
    staff.role.toLowerCase().includes(staffFilter.toLowerCase())
  );

  const fetchStaffContacts = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const response = await api.communication.getStaffContacts();
      if (response.success && Array.isArray(response.data)) {
        setStaffContacts(response.data);
      }
    } catch (err) {
      console.error('Failed to load staff contacts', err);
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    if (showCompose) {
      fetchStaffContacts();
    }
  }, [showCompose, fetchStaffContacts]);

  // Broadcast State
  const [activeGrades, setActiveGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [allRecipients, setAllRecipients] = useState([]);  // All parents for the grade
  const [recipients, setRecipients] = useState([]);        // Selected parents
  const [selectedRecipientIds, setSelectedRecipientIds] = useState(new Set());
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [deliveryReport, setDeliveryReport] = useState([]);

  // Test Parent State
  const [showTestMode, setShowTestMode] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Message Template State
  const [messageTemplate, setMessageTemplate] = useState('');
  const [templateVariables, setTemplateVariables] = useState({}); // {parentName: 'John', etc}

  // Preview State
  const [showPreview, setShowPreview] = useState(false);

  // Fetch recipients when grade changes
  const fetchRecipients = useCallback(async () => {
    if (!selectedGrade) {
      setAllRecipients([]);
      setRecipients([]);
      setSelectedRecipientIds(new Set());
      return;
    }

    setLoadingRecipients(true);
    try {
      const response = await api.communication.getRecipients(selectedGrade);

      if (response.success && Array.isArray(response.data)) {
        // Ensure phone numbers are formatted
        const formattedRecipients = response.data.map(r => ({
          ...r,
          phone: formatPhoneNumber(r.phone || ''),
          displayPhone: getDisplayPhoneNumber(r.phone || ''),
          id: r.id || `${r.name}-${r.phone}` // Fallback ID
        })).filter(r => r.phone); // Only keep recipients with valid phone numbers

        setAllRecipients(formattedRecipients);
        setRecipients(formattedRecipients);
        // Select all by default
        const allIds = new Set(formattedRecipients.map(r => r.id));
        setSelectedRecipientIds(allIds);
      } else {
        setAllRecipients([]);
        setRecipients([]);
        setSelectedRecipientIds(new Set());
      }

    } catch (err) {
      console.error('Failed to fetch recipients', err);
      showError('Failed to load recipients. Please try again.');
      setAllRecipients([]);
      setRecipients([]);
      setSelectedRecipientIds(new Set());
    } finally {
      setLoadingRecipients(false);
    }
  }, [selectedGrade, showError]);

  const { grades: fetchedGrades } = useSchoolData();

  const fetchInboxMessages = useCallback(async () => {
    try {
      const response = await api.communication.getInboxMessages();
      if (response?.success && Array.isArray(response.data)) {
        const mapped = response.data.map((receipt) => ({
          id: receipt.messageId,
          receiptId: receipt.id,
          subject: receipt.message?.subject || 'New message',
          preview: receipt.message?.body ? receipt.message.body.slice(0, 160) : '',
          sender: receipt.message?.senderType || 'System',
          senderRole: receipt.message?.senderType || 'System',
          date: receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : '',
          read: receipt.status === 'READ' || !!receipt.readAt
        }));
        setInboxMessages(mapped);
      }
    } catch (error) {
      console.error('Failed to load inbox messages:', error);
    }
  }, []);

  // Fetch active grades on mount
  useEffect(() => {
    if (fetchedGrades && fetchedGrades.length > 0) {
      setActiveGrades(fetchedGrades);
    }
  }, [fetchedGrades]);

  useEffect(() => {
    fetchInboxMessages();
  }, [fetchInboxMessages]);

  const handleMarkMessageRead = async (receiptId) => {
    if (!receiptId) return;
    try {
      await api.communication.markMessageRead(receiptId);
      setInboxMessages((prev) => prev.map((msg) => msg.receiptId === receiptId ? { ...msg, read: true } : msg));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  // Fetch recipients when grade changes
  useEffect(() => {
    fetchRecipients();
  }, [selectedGrade, fetchRecipients]);

  // Toggle recipient selection
  const toggleRecipient = (recipientId) => {
    const newSelected = new Set(selectedRecipientIds);
    if (newSelected.has(recipientId)) {
      newSelected.delete(recipientId);
    } else {
      newSelected.add(recipientId);
    }
    setSelectedRecipientIds(newSelected);

    // Update recipients array with selected items
    const selected = allRecipients.filter(r => newSelected.has(r.id));
    setRecipients(selected);
  };

  // Select/Deselect all
  const toggleSelectAll = () => {
    if (selectedRecipientIds.size === allRecipients.length) {
      setSelectedRecipientIds(new Set());
      setRecipients([]);
    } else {
      const allIds = new Set(allRecipients.map(r => r.id));
      setSelectedRecipientIds(allIds);
      setRecipients(allRecipients);
    }
  };

  // Process message template variables
  const processMessageTemplate = (template, variables = {}) => {
    let message = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      message = message.replace(regex, variables[key] || `{${key}}`);
    });
    return message;
  };

  // Send test message to test parent
  const handleSendTestMessage = async () => {
    console.log('🧪 Test message initiated');
    console.log('Phone:', testPhoneNumber);
    console.log('Message:', messageTemplate);

    if (!testPhoneNumber) {
      showError('Phone number is required');
      return;
    }

    if (!isValidPhoneNumber(testPhoneNumber)) {
      showError('Invalid phone format. Use format like 0712345678 or +254712345678');
      return;
    }

    if (!messageTemplate.trim()) {
      showError('Message cannot be empty');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const formattedPhone = formatPhoneNumber(testPhoneNumber);

      // School ID removed for single-tenant mode
      const schoolId = null; 

      const messageToSend = processMessageTemplate(messageTemplate, templateVariables);
      console.log('📝 Message to send:', messageToSend);

      console.log('🚀 Calling API...');
      const response = await api.communication.sendTestSMS({
        phoneNumber: formattedPhone,
        message: messageToSend,
        schoolId
      });

      console.log('✅ API Response:', response);

      if (response && response.message) {
        setTestResult({
          success: true,
          message: `✓ Test message sent to ${getDisplayPhoneNumber(testPhoneNumber)}. Message ID: ${response.messageId || 'N/A'}`,
          timestamp: new Date().toLocaleString()
        });
        showSuccess(`Test SMS sent to ${getDisplayPhoneNumber(testPhoneNumber)}`);
      } else {
        throw new Error('No response from server');
      }
    } catch (error) {
      console.error('❌ Test message error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const errorMessage = error.response?.data?.error || error.message || 'Failed to send test message';

      setTestResult({
        success: false,
        message: `✗ Failed: ${errorMessage}`,
        timestamp: new Date().toLocaleString()
      });
      showError(`SMS Error: ${errorMessage}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Handle broadcast to selected recipients
  const handleSendBroadcast = async () => {
    if (!messageTemplate.trim()) {
      showError('Please enter a message');
      return;
    }
    if (recipients.length === 0) {
      showError('Please select at least one recipient');
      return;
    }

    const confirmed = window.confirm(
      `Send broadcast to ${recipients.length} recipient(s)?\n\nMessage preview:\n"${messageTemplate.substring(0, 50)}..."`
    );
    if (!confirmed) return;

    setSending(true);
    setProgress({ current: 0, total: recipients.length, success: 0, failed: 0 });
    setDeliveryReport([]);

    const schoolId = null; // Removed for single-tenant mode
    const report = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      let status = 'Pending';
      let error = null;

      try {
        const messageToSend = processMessageTemplate(messageTemplate, {
          parentName: recipient.name,
          studentName: recipient.studentName,
          grade: recipient.grade,
          schoolName: 'School'
        });

        await api.communication.sendTestSMS({
          phoneNumber: recipient.phone,
          message: messageToSend
        });

        status = 'Sent';
        setProgress(prev => ({ ...prev, current: i + 1, success: prev.success + 1 }));
      } catch (err) {
        console.error(`Failed to send to ${recipient.name}:`, err);
        status = 'Failed';
        error = err.message;
        setProgress(prev => ({ ...prev, current: i + 1, failed: prev.failed + 1 }));
      }

      report.push({ ...recipient, status, error });
      setDeliveryReport([...report]);

      // Small delay to prevent rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    setSending(false);
    showSuccess(`Broadcast complete. Sent: ${progress.success}, Failed: ${progress.failed}`);
  };

  // Parse CSV/Excel file for bulk phone numbers
  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n');
          const numbers = [];

          lines.forEach((line, idx) => {
            // Skip header row if it contains 'phone', 'number', etc
            if (idx === 0 && (line.toLowerCase().includes('phone') || line.toLowerCase().includes('number'))) return;

            // Extract phone numbers from the line
            const matches = line.match(/[\d+\-\s()]+/g);
            if (matches) {
              let phone = matches[0].replace(/[\s\-()]/g, '');
              // Validate that it's a number with at least 9 digits
              if (/^\d+$/.test(phone) && phone.length >= 9) {
                numbers.push(phone);
              }
            }
          });

          resolve([...new Set(numbers)]); // Remove duplicates
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  };

  // Handle CSV file upload
  const handleLoadCsvFile = async (file) => {
    if (!file) return;

    try {
      const numbers = await parseCSVFile(file);
      if (numbers.length === 0) {
        showError('No valid phone numbers found in file');
        return;
      }
      setComposePhones(numbers);
      setComposeCsvFile(file);
      showSuccess(`Loaded ${numbers.length} phone numbers from ${file.name}`);
    } catch (err) {
      console.error('CSV parsing error:', err);
      showError('Failed to parse file');
    }
  };

  // Send single direct message
  const handleSendDirectMessage = async () => {
    // Determine recipients based on mode
    const recipients = composeInputMode === 'single' ? [composePhone] : composePhones;

    if (recipients.length === 0) {
      showError(composeInputMode === 'single' ? 'Phone number is required' : 'No phone numbers loaded');
      return;
    }

    // Validate all recipients
    for (const phone of recipients) {
      if (!isValidPhoneNumber(phone)) {
        showError(`Invalid phone format: ${phone}`);
        return;
      }
    }

    if (!composeMessage.trim()) {
      showError('Message cannot be empty');
      return;
    }

    let scheduledForValue;
    if (composeScheduledFor) {
      const scheduledDate = new Date(composeScheduledFor);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        showError('Schedule must be a future date and time');
        return;
      }
      scheduledForValue = scheduledDate.toISOString();
    }

    const confirmed = window.confirm(
      `Send message to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}?\n\nMessage: "${composeMessage.substring(0, 50)}${composeMessage.length > 50 ? '...' : ''}"`
    );
    if (!confirmed) return;

    setIsSendingCompose(true);

    try {
      // School ID removed for single-tenant mode
      const schoolId = null;

      let successCount = 0;
      const report = [];

      // Send to each recipient
      for (let i = 0; i < recipients.length; i++) {
        const phone = recipients[i];
        let status = 'Sent';
        let error = null;
        let messageId = null;

        try {
          const formattedPhone = formatPhoneNumber(phone);

          const response = await api.communication.sendTestSMS({
            phoneNumber: formattedPhone,
            message: composeMessage,
            ...(scheduledForValue ? { scheduledFor: scheduledForValue } : {})
          });

          messageId = response?.messageId || response?.id || `MSG-${Date.now()}-${i}`;
          successCount++;
        } catch (err) {
          status = 'Failed';
          error = err.message;
          console.error(`Failed to send to ${phone}:`, err);
        }

        report.push({
          phone,
          displayPhone: getDisplayPhoneNumber(phone),
          status,
          error,
          messageId,
          sentAt: new Date().toLocaleTimeString()
        });

        // Small delay to prevent rate limiting
        await new Promise(r => setTimeout(r, 100));
      }

      setComposeSendReport(report);
      setShowComposeReport(true);
      showSuccess(`Messages sent: ${successCount}/${recipients.length} delivered`);
    } catch (error) {
      console.error('Error sending messages:', error);
      showError(`Failed to send messages: ${error.message}`);
    } finally {
      setIsSendingCompose(false);
    }
  };

  // Reset compose state
  const resetComposeState = () => {
    setComposeInputMode('single');
    setComposePhone('');
    setComposePhones([]);
    setComposeCsvFile(null);
    setComposeSubject('');
    setComposeMessage('');
    setComposeScheduledFor('');
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header Section */}
      <div className="bg-brand-purple px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <MessageSquare size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-white">Messages & Inbox</h1>
            <p className="text-white/80 text-sm">Manage communications and broadcast messages</p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none bg-white border-b border-gray-200 p-0 h-auto justify-start">
            <TabsTrigger
              value="inbox"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-teal data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-4 flex items-center gap-2"
            >
              <MessageSquare size={16} />
              <span className="font-medium">Inbox</span>
            </TabsTrigger>
            <TabsTrigger
              value="broadcast"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-purple data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-4 flex items-center gap-2"
            >
              <Send size={16} />
              <span className="font-medium">Broadcast Messages</span>
            </TabsTrigger>
          </TabsList>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="flex-1 overflow-auto">
            <div className="p-6 space-y-4 h-full flex flex-col">
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowCompose(true)}
                  className="bg-brand-teal hover:bg-brand-teal/90 text-white font-medium gap-2"
                >
                  <Plus size={20} />
                  Compose Message
                </Button>
              </div>

              <div className="flex-1 overflow-auto">
                {inboxMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Messages</h3>
                      <p className="text-gray-400 max-w-sm">Your inbox is empty. Create a new message to get started.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inboxMessages.map(msg => (
                      <Card key={msg.id} className={`${!msg.read ? 'bg-blue-50 border-blue-200' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-800">{msg.subject}</h3>
                                {!msg.read && (
                                  <Badge className="bg-blue-600">New</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                From: <span className="font-medium">{msg.sender}</span> ({msg.senderRole})
                              </p>
                              <p className="text-sm text-gray-600">{msg.preview}</p>
                              <p className="text-xs text-gray-500 mt-2">{msg.date}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-brand-teal hover:bg-brand-teal/10">
                              <Reply size={18} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast" className="flex-1 overflow-hidden">
            <BroadcastMessagesPage />
          </TabsContent>
        </Tabs>
      </div>

      {/* Compose Modal */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <Plus size={20} className="text-brand-teal" />
              Send Message
            </DialogTitle>
            <DialogDescription>
              Send a direct message to one or multiple recipients
            </DialogDescription>
          </DialogHeader>

          <Tabs value={composeInputMode} onValueChange={setComposeInputMode} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
            {/* Staff Directory Tab */}
            <TabsTrigger value="staff" className="gap-2">
              <Users size={16} />
              Staff Directory
            </TabsTrigger>
          </TabsList>

          {/* Single Message Tab */}
          <TabsContent value="single" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="composePhone" className="font-medium">Phone Number</Label>
              <Input
                id="composePhone"
                type="tel"
                value={composePhone}
                onChange={(e) => setComposePhone(e.target.value)}
                placeholder="0712345678, +254712345678, or 254712345678"
                disabled={isSendingCompose}
              />
              {composePhone.trim() && (
                <div className="text-sm">
                  {isValidPhoneNumber(composePhone) ? (
                    <p className="text-green-600 font-semibold">
                      ✓ Will send to: {getDisplayPhoneNumber(composePhone)}
                    </p>
                  ) : (
                    <p className="text-red-600 font-semibold">
                      ✗ Invalid phone format. Try: 0712345678 or +254712345678
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bulk Upload Tab */}
          <TabsContent value="bulk" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csvFile" className="font-medium">Upload CSV or Excel File</Label>
              <p className="text-xs text-gray-500">File should contain phone numbers (with or without header row)</p>
              <input
                id="csvFile"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleLoadCsvFile(e.target.files?.[0])}
                disabled={isSendingCompose}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-teal file:text-white file:font-medium hover:file:bg-brand-teal/90 cursor-pointer"
              />
            </div>

            {composeCsvFile && composePhones.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-green-700 mb-2">✓ File loaded successfully</p>
                  <p className="text-sm text-green-600">{composeCsvFile.name}</p>
                  <p className="text-lg font-medium text-green-700 mt-2">{composePhones.length} phone numbers</p>
                  <div className="mt-3 max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium text-green-600 mb-1">First 10 numbers:</p>
                    <div className="space-y-1">
                      {composePhones.slice(0, 10).map((phone, idx) => (
                        <p key={idx} className="text-xs text-green-600 font-mono">
                          {getDisplayPhoneNumber(phone)}
                        </p>
                      ))}
                      {composePhones.length > 10 && (
                        <p className="text-xs text-green-600">+{composePhones.length - 10} more...</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Staff Directory Tab Content */}
          <TabsContent value="staff" className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search staff by name or role..."
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="pl-10"
              />
              <Users className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded-lg divide-y divide-gray-100">
              {loadingStaff ? (
                <div className="p-8 text-center">
                  <Loader2 className="animate-spin mx-auto text-brand-teal mb-2" size={24} />
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">Loading directory...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-400">No staff members found matching "{staffFilter}"</p>
                </div>
              ) : (
                filteredStaff.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => {
                      setComposePhone(staff.phone);
                      setComposeInputMode('single');
                      setStaffFilter('');
                      showSuccess(`Selected ${staff.name}`);
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-900 group-hover:text-brand-purple transition-colors">{staff.name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{staff.role.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-gray-500">{getDisplayPhoneNumber(staff.phone)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <p className="text-[10px] italic text-gray-400 text-center font-medium">Click a staff member to select them as a recipient</p>
          </TabsContent>
        </Tabs>

          <div className="space-y-4">
            <Label htmlFor="composeSubject" className="font-medium">Subject (optional)</Label>
            <Input
              id="composeSubject"
              type="text"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="Enter message subject..."
              disabled={isSendingCompose}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="msgContent" className="font-medium">Message</Label>
            <textarea
              id="msgContent"
              rows={6}
              value={composeMessage}
              onChange={(e) => setComposeMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal resize-none"
              placeholder="Type your message..."
              disabled={isSendingCompose}
            />
            <div className="text-right text-xs text-gray-500">
              {composeMessage.length} characters
            </div>
          </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledFor" className="font-medium">Schedule Send</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={composeScheduledFor}
                onChange={(e) => setComposeScheduledFor(e.target.value)}
                disabled={isSendingCompose}
              />
              <p className="text-xs text-gray-500">Leave blank to send immediately or schedule a future delivery.</p>
            </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCompose(false);
                resetComposeState();
              }}
              disabled={isSendingCompose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendDirectMessage}
              disabled={
                isSendingCompose ||
                !composeMessage.trim() ||
                (composeInputMode === 'single' && !composePhone) ||
                (composeInputMode === 'bulk' && composePhones.length === 0)
              }
              className="bg-brand-teal hover:bg-brand-teal/90 text-white font-medium gap-2"
            >
              {isSendingCompose ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {isSendingCompose ? 'Sending...' : `Send to ${composeInputMode === 'single' ? '1' : composePhones.length || '0'
                }`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Delivery Report Modal */}
      <Dialog open={showComposeReport} onOpenChange={setShowComposeReport}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Message Delivery Report
            </DialogTitle>
            <DialogDescription>
              Detailed delivery status for each recipient
            </DialogDescription>
          </DialogHeader>

          {composeSendReport.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Card className="bg-green-50">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-2xl font-medium text-green-700">{composeSendReport.length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-600">Sent</p>
                    <p className="text-2xl font-medium text-green-700">
                      {composeSendReport.filter(r => r.status === 'Sent').length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-600">Failed</p>
                    <p className="text-2xl font-medium text-red-700">
                      {composeSendReport.filter(r => r.status === 'Failed').length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <table className="w-full text-xs border">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-[color:var(--table-header-fg)]">Phone</th>
                    <th className="px-3 py-2 text-left font-semibold text-[color:var(--table-header-fg)]">Status</th>
                    <th className="px-3 py-2 text-left font-semibold text-[color:var(--table-header-fg)]">Message ID</th>
                    <th className="px-3 py-2 text-left font-semibold text-[color:var(--table-header-fg)]">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y max-h-48 overflow-y-auto">
                  {composeSendReport.map((r, i) => (
                    <tr key={i} className={r.status === 'Sent' ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-3 py-2 font-mono">{r.displayPhone}</td>
                      <td className="px-3 py-2">
                        <Badge className={r.status === 'Sent' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                          {r.status === 'Sent' ? <CheckCircle size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.messageId}</td>
                      <td className="px-3 py-2 text-gray-600">{r.sentAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setShowComposeReport(false);
                setShowCompose(false);
                resetComposeState();
              }}
              className="bg-brand-teal hover:bg-brand-teal/90 text-white font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesPage;
