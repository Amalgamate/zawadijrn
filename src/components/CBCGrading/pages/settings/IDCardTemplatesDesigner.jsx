import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, Image as ImageIcon, Plus, Trash2, CheckCircle, UploadCloud, LayoutTemplate } from 'lucide-react';
import { idTemplateAPI } from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const DEFAULT_LAYOUT = {
  photo: { show: true, x: 20, y: 70, width: 80, height: 80, borderRadius: 10 },
  fullName: { show: true, x: 115, y: 75, fontSize: 16, color: '#000000', fontWeight: 'bold' },
  admNo: { show: true, x: 115, y: 100, fontSize: 12, color: '#333333', fontWeight: 'normal' },
  grade: { show: true, x: 115, y: 120, fontSize: 12, color: '#333333', fontWeight: 'normal' },
  barcode: { show: true, x: 20, y: 160, width: 280, height: 26 }
};

const DUMMY_STUDENT = {
  firstName: 'John',
  lastName: 'Doe',
  admNo: 'ADM-1234',
  grade: 'Grade 5',
  stream: 'East',
  photoUrl: 'https://i.pravatar.cc/150?img=11',
};

const IDCardTemplatesDesigner = () => {
  const { showSuccess, showError, showWarning } = useNotifications();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Create / Edit active draft state
  const [draft, setDraft] = useState({
    templateName: 'New Template',
    templateType: 'LEARNER',
    templateDesign: '', 
    width: 320,
    height: 204,
    isActive: false,
    layoutConfig: JSON.parse(JSON.stringify(DEFAULT_LAYOUT))
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const resp = await idTemplateAPI.getAll();
      if (resp.success) {
        setTemplates(resp.data);
      }
    } catch (err) {
      showError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (t) => {
    setSelectedTemplate(t.id);
    setDraft({
      templateName: t.templateName,
      templateType: t.templateType,
      templateDesign: t.templateDesign,
      width: t.width,
      height: t.height,
      isActive: t.isActive,
      layoutConfig: typeof t.layoutConfig === 'object' ? t.layoutConfig : JSON.parse(t.layoutConfig || JSON.stringify(DEFAULT_LAYOUT))
    });
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setDraft({
      templateName: `Template ${templates.length + 1}`,
      templateType: 'LEARNER',
      templateDesign: '',
      width: 320,
      height: 204,
      isActive: false,
      layoutConfig: JSON.parse(JSON.stringify(DEFAULT_LAYOUT))
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      showWarning('Image must be under 1MB to respect backend body limits');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setDraft(prev => ({ ...prev, templateDesign: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const updateFieldConfig = (fieldName, prop, val) => {
    setDraft(prev => ({
      ...prev,
      layoutConfig: {
        ...prev.layoutConfig,
        [fieldName]: {
          ...prev.layoutConfig[fieldName],
          [prop]: val
        }
      }
    }));
  };

  const handleSave = async () => {
    if (!draft.templateName.trim()) {
      showWarning('Template name is required');
      return;
    }
    
    setSaving(true);
    try {
      if (selectedTemplate) {
        await idTemplateAPI.update(selectedTemplate, draft);
        showSuccess('Template updated successfully');
      } else {
        const resp = await idTemplateAPI.create(draft);
        if (resp.success) {
          setSelectedTemplate(resp.data.id);
          showSuccess('Template created successfully');
        }
      }
      fetchTemplates();
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await idTemplateAPI.delete(id);
      showSuccess('Template deleted');
      if (selectedTemplate === id) handleCreateNew();
      fetchTemplates();
    } catch (err) {
      showError('Failed to delete');
    }
  };

  const renderConfigControls = (fieldName, label, isText = true) => {
    const config = draft.layoutConfig[fieldName];
    if (!config) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 relative group">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-800 text-sm">{label}</h4>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-500 cursor-pointer">
            <input 
              type="checkbox" 
              checked={config.show} 
              onChange={e => updateFieldConfig(fieldName, 'show', e.target.checked)}
              className="rounded text-brand-purple focus:ring-brand-purple"
            />
            Visible
          </label>
        </div>

        {config.show && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X Pos (px)</label>
              <input type="number" value={config.x} onChange={e => updateFieldConfig(fieldName, 'x', Number(e.target.value))} className="w-full text-sm p-1.5 border rounded border-gray-300" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y Pos (px)</label>
              <input type="number" value={config.y} onChange={e => updateFieldConfig(fieldName, 'y', Number(e.target.value))} className="w-full text-sm p-1.5 border rounded border-gray-300" />
            </div>

            {isText ? (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Size (px)</label>
                  <input type="number" value={config.fontSize} onChange={e => updateFieldConfig(fieldName, 'fontSize', Number(e.target.value))} className="w-full text-sm p-1.5 border rounded border-gray-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Color</label>
                  <input type="color" value={config.color} onChange={e => updateFieldConfig(fieldName, 'color', e.target.value)} className="w-full h-8 p-0.5 rounded cursor-pointer" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                  <input type="number" value={config.width} onChange={e => updateFieldConfig(fieldName, 'width', Number(e.target.value))} className="w-full text-sm p-1.5 border rounded border-gray-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                  <input type="number" value={config.height} onChange={e => updateFieldConfig(fieldName, 'height', Number(e.target.value))} className="w-full text-sm p-1.5 border rounded border-gray-300" />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <h2 className="text-xl font-medium text-gray-800 flex items-center gap-2">
                 <LayoutTemplate className="text-brand-purple" />
                 ID Card Template Designer
               </h2>
               <p className="text-sm text-gray-500 mt-1">Upload a background design from your graphic designer and map text placements.</p>
            </div>
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-brand-purple/10 text-brand-purple font-medium text-sm rounded-lg hover:bg-brand-purple/20 transition"
            >
              <Plus size={16} /> New Template
            </button>
         </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
         {/* Sidebar: Template List */}
         <div className="xl:w-1/4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-medium text-gray-800 mb-4 px-2">Saved Templates</h3>
            <div className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-gray-400 italic px-2">No templates yet. Create one.</p>
              ) : (
                templates.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => handleSelectTemplate(t)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition border ${selectedTemplate === t.id ? 'bg-brand-purple/5 border-brand-purple/30 text-brand-purple font-medium' : 'border-transparent hover:bg-gray-50 text-gray-700'}`}
                  >
                    <div className="flex items-center gap-2">
                       {t.isActive ? <CheckCircle size={14} className="text-brand-teal" /> : <div className="w-3.5" />}
                       <span className="text-sm truncate w-32">{t.templateName}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
         </div>

         {/* Main Editor */}
         <div className="xl:w-3/4 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               {/* Controls Bar */}
               <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input 
                      type="text" 
                      value={draft.templateName}
                      onChange={e => setDraft(prev => ({ ...prev, templateName: e.target.value }))}
                      className="text-base font-medium bg-white border border-gray-300 rounded px-3 py-1.5 focus:ring-2 ring-brand-purple w-full sm:w-64"
                      placeholder="Template Name"
                    />
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 whitespace-nowrap bg-white border border-gray-300 px-3 py-1.5 rounded cursor-pointer hover:bg-gray-50">
                       <input 
                         type="checkbox" 
                         checked={draft.isActive}
                         onChange={e => setDraft(prev => ({ ...prev, isActive: e.target.checked }))}
                         className="rounded text-brand-teal focus:ring-brand-teal"
                       />
                       Mark as Active Profile
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                     <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                     >
                       <UploadCloud size={16} /> Background
                     </button>
                     <button 
                       onClick={handleSave}
                       disabled={saving}
                       className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-6 py-2 bg-brand-purple text-white rounded-lg text-sm font-medium hover:bg-brand-purple/90 shadow-sm disabled:opacity-50"
                     >
                       <Save size={16} /> {saving ? 'Saving...' : 'Save Layout'}
                     </button>
                  </div>
               </div>

               {/* Live Preview Area */}
               <div className="p-8 bg-gray-100 flex justify-center items-center min-h-[300px] overflow-x-auto relative">
                  
                  <p className="absolute top-4 left-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Live Preview</p>
                  
                  <div 
                    className="relative shadow-2xl rounded-lg overflow-hidden flex-shrink-0"
                    style={{ 
                      width: `${draft.width}px`, 
                      height: `${draft.height}px`,
                      backgroundColor: '#fff',
                      backgroundImage: draft.templateDesign ? `url(${draft.templateDesign})` : 'none',
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {!draft.templateDesign && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={32} className="opacity-30 mb-2" />
                        <p className="text-sm font-semibold opacity-50">Upload a background image (e.g. 320x204)</p>
                      </div>
                    )}

                    {/* Rendering Layout Config dynamically over the image */}
                    {draft.layoutConfig.photo?.show && (
                       <img 
                         src={DUMMY_STUDENT.photoUrl} 
                         alt=""
                         className="absolute object-cover bg-gray-200"
                         style={{
                           left: draft.layoutConfig.photo.x,
                           top: draft.layoutConfig.photo.y,
                           width: draft.layoutConfig.photo.width,
                           height: draft.layoutConfig.photo.height,
                           borderRadius: draft.layoutConfig.photo.borderRadius || 0
                         }}
                       />
                    )}

                    {draft.layoutConfig.fullName?.show && (
                       <div 
                         className="absolute whitespace-nowrap"
                         style={{
                           left: draft.layoutConfig.fullName.x,
                           top: draft.layoutConfig.fullName.y,
                           fontSize: draft.layoutConfig.fullName.fontSize,
                           color: draft.layoutConfig.fullName.color,
                           fontWeight: draft.layoutConfig.fullName.fontWeight
                         }}
                       >
                         {DUMMY_STUDENT.firstName} {DUMMY_STUDENT.lastName}
                       </div>
                    )}

                    {draft.layoutConfig.admNo?.show && (
                       <div 
                         className="absolute whitespace-nowrap"
                         style={{
                           left: draft.layoutConfig.admNo.x,
                           top: draft.layoutConfig.admNo.y,
                           fontSize: draft.layoutConfig.admNo.fontSize,
                           color: draft.layoutConfig.admNo.color,
                           fontWeight: draft.layoutConfig.admNo.fontWeight
                         }}
                       >
                         {draft.layoutConfig.admNo.prefix || 'Adm: '} {DUMMY_STUDENT.admNo}
                       </div>
                    )}

                    {draft.layoutConfig.grade?.show && (
                       <div 
                         className="absolute whitespace-nowrap"
                         style={{
                           left: draft.layoutConfig.grade.x,
                           top: draft.layoutConfig.grade.y,
                           fontSize: draft.layoutConfig.grade.fontSize,
                           color: draft.layoutConfig.grade.color,
                           fontWeight: draft.layoutConfig.grade.fontWeight
                         }}
                       >
                         {draft.layoutConfig.grade.prefix || ''}{DUMMY_STUDENT.grade} {DUMMY_STUDENT.stream}
                       </div>
                    )}

                    {draft.layoutConfig.barcode?.show && (
                       <div 
                         className="absolute bg-white/70 backdrop-blur-sm border border-gray-300 flex items-center justify-center text-[10px] font-mono tracking-widest text-[#000000]"
                         style={{
                           left: draft.layoutConfig.barcode.x,
                           top: draft.layoutConfig.barcode.y,
                           width: draft.layoutConfig.barcode.width,
                           height: draft.layoutConfig.barcode.height
                         }}
                       >
                         || |||||| | ||| || ||| (BARCODE)
                       </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Layout Coordinate Editors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderConfigControls('photo', 'Student Photo Indicator', false)}
              {renderConfigControls('fullName', 'Student Name', true)}
              {renderConfigControls('admNo', 'Admission Number', true)}
              {renderConfigControls('grade', 'Class / Grade', true)}
              {renderConfigControls('barcode', 'Barcode / QR Area', false)}
            </div>
         </div>
      </div>
    </div>
  );
};

export default IDCardTemplatesDesigner;
