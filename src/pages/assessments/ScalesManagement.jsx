import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';

const ScalesManagement = () => {
  const [scales, setScales] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [errors, setErrors] = useState({});

  const [newScale, setNewScale] = useState({
    name: '',
    description: '',
    levels: []
  });

  // Load scales from localStorage on mount
  useEffect(() => {
    loadScales();
  }, []);

  const loadScales = () => {
    try {
      const savedScales = localStorage.getItem('assessment-scales');
      if (savedScales) {
        setScales(JSON.parse(savedScales));
      } else {
        // Initialize with default CBC scales
        const defaultScales = [
          {
            id: '1',
            name: 'Competency Scale',
            description: 'Standard CBC competency assessment scale',
            levels: [
              { value: 'EE', label: 'Exceeds Expectations', description: 'Outstanding performance' },
              { value: 'ME', label: 'Meets Expectations', description: 'Satisfactory performance' },
              { value: 'AP', label: 'Approaching Expectations', description: 'Developing performance' },
              { value: 'BE', label: 'Below Expectations', description: 'Needs support' }
            ],
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Values Scale',
            description: 'National values assessment scale',
            levels: [
              { value: 'CE', label: 'Consistently Evident', description: 'Always demonstrates' },
              { value: 'FE', label: 'Frequently Evident', description: 'Often demonstrates' },
              { value: 'OE', label: 'Occasionally Evident', description: 'Sometimes demonstrates' },
              { value: 'RE', label: 'Rarely Evident', description: 'Seldom demonstrates' }
            ],
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Performance Scale',
            description: 'Co-curricular activities performance scale',
            levels: [
              { value: 'EX', label: 'Excellent', description: 'Exceptional performance' },
              { value: 'VG', label: 'Very Good', description: 'Strong performance' },
              { value: 'GO', label: 'Good', description: 'Satisfactory performance' },
              { value: 'NI', label: 'Needs Improvement', description: 'Requires development' }
            ],
            createdAt: new Date().toISOString()
          }
        ];
        setScales(defaultScales);
        localStorage.setItem('assessment-scales', JSON.stringify(defaultScales));
      }
    } catch (error) {
      console.error('Error loading scales:', error);
      setSaveStatus('error');
    }
  };

  const saveScales = (updatedScales) => {
    try {
      localStorage.setItem('assessment-scales', JSON.stringify(updatedScales));
      setScales(updatedScales);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving scales:', error);
      setSaveStatus('error');
    }
  };

  const validateScale = (scale) => {
    console.log('=== VALIDATING SCALE ===');
    console.log('Input scale:', scale);
    
    const newErrors = {};
    
    // Check name
    if (!scale.name || !scale.name.trim()) {
      console.log('❌ Name is empty or whitespace');
      newErrors.name = 'Scale name is required';
    } else {
      console.log('✅ Name is valid:', scale.name);
    }
    
    // Check levels exist
    if (!scale.levels || scale.levels.length === 0) {
      console.log('❌ No levels found');
      newErrors.levels = 'At least one level is required';
    } else {
      console.log('✅ Has', scale.levels.length, 'levels');
    }
    
    // Check each level
    scale.levels.forEach((level, index) => {
      console.log(`Checking level ${index}:`, level);
      
      if (!level.value || !level.value.trim()) {
        console.log(`  ❌ Level ${index} value is empty`);
        newErrors[`level_${index}_value`] = 'Level value is required';
      } else {
        console.log(`  ✅ Level ${index} value OK:`, level.value);
      }
      
      if (!level.label || !level.label.trim()) {
        console.log(`  ❌ Level ${index} label is empty`);
        newErrors[`level_${index}_label`] = 'Level label is required';
      } else {
        console.log(`  ✅ Level ${index} label OK:`, level.label);
      }
    });
    
    console.log('Total errors found:', Object.keys(newErrors).length);
    console.log('Errors object:', newErrors);
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddScale = () => {
    if (!validateScale(newScale)) {
      return;
    }

    const scale = {
      id: Date.now().toString(),
      ...newScale,
      createdAt: new Date().toISOString()
    };

    saveScales([...scales, scale]);
    setNewScale({ name: '', description: '', levels: [] });
    setShowAddForm(false);
    setErrors({});
  };

  const handleDeleteScale = (id) => {
    if (window.confirm('Are you sure you want to delete this scale? This action cannot be undone.')) {
      saveScales(scales.filter(s => s.id !== id));
    }
  };

  const handleEditScale = (scale) => {
    setEditingId(scale.id);
    setErrors({}); // Clear any existing errors when starting to edit
  };

  const handleSaveEdit = (id) => {
    const scaleToValidate = scales.find(s => s.id === id);
    
    // Debug: log the scale being validated
    console.log('=== ATTEMPTING TO SAVE SCALE ===');
    console.log('Scale ID:', id);
    console.log('Scale data:', JSON.stringify(scaleToValidate, null, 2));
    console.log('Scale name:', scaleToValidate.name);
    console.log('Scale levels count:', scaleToValidate.levels.length);
    console.log('Scale levels:', scaleToValidate.levels);
    
    // Check each level
    scaleToValidate.levels.forEach((level, i) => {
      console.log(`Level ${i}:`, {
        value: level.value,
        label: level.label,
        description: level.description
      });
    });
    
    if (!validateScale(scaleToValidate)) {
      console.log('❌ VALIDATION FAILED');
      console.log('Errors:', errors);
      return;
    }
    
    console.log('✅ VALIDATION PASSED - Saving to localStorage...');
    saveScales(scales);
    console.log('✅ SAVED SUCCESSFULLY');
    setEditingId(null);
    setErrors({});
  };

  const handleCancelEdit = () => {
    loadScales(); // Reload to discard changes
    setEditingId(null);
    setErrors({});
  };

  const updateScale = (id, field, value) => {
    setScales(scales.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
    // Clear error for this field when it changes
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateScaleLevel = (scaleId, levelIndex, field, value) => {
    setScales(scales.map(s => {
      if (s.id === scaleId) {
        const updatedLevels = [...s.levels];
        updatedLevels[levelIndex] = { ...updatedLevels[levelIndex], [field]: value };
        return { ...s, levels: updatedLevels };
      }
      return s;
    }));
    // Clear error for this level field when it changes
    const errorKey = `level_${levelIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addLevelToScale = (scaleId) => {
    setScales(scales.map(s => {
      if (s.id === scaleId) {
        return {
          ...s,
          levels: [...s.levels, { value: '', label: '', description: '' }]
        };
      }
      return s;
    }));
  };

  const removeLevelFromScale = (scaleId, levelIndex) => {
    setScales(scales.map(s => {
      if (s.id === scaleId) {
        return {
          ...s,
          levels: s.levels.filter((_, i) => i !== levelIndex)
        };
      }
      return s;
    }));
  };

  const addLevelToNewScale = () => {
    setNewScale({
      ...newScale,
      levels: [...newScale.levels, { value: '', label: '', description: '' }]
    });
  };

  const updateNewScaleLevel = (index, field, value) => {
    const updatedLevels = [...newScale.levels];
    updatedLevels[index] = { ...updatedLevels[index], [field]: value };
    setNewScale({ ...newScale, levels: updatedLevels });
  };

  const removeNewScaleLevel = (index) => {
    setNewScale({
      ...newScale,
      levels: newScale.levels.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Assessment Scales Management</h1>
              <p className="text-gray-600 mt-2">Create and manage grading scales for summative assessments</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAddForm ? <X size={20} /> : <Plus size={20} />}
              {showAddForm ? 'Cancel' : 'Add New Scale'}
            </button>
          </div>

          {/* Save Status */}
          {saveStatus && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              saveStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {saveStatus === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
              {saveStatus === 'success' ? 'Changes saved successfully!' : 'Error saving changes. Please try again.'}
            </div>
          )}
        </div>

        {/* Add New Scale Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Scale</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scale Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newScale.name}
                  onChange={(e) => setNewScale({ ...newScale, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Academic Performance Scale"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newScale.description}
                  onChange={(e) => setNewScale({ ...newScale, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="Brief description of when to use this scale"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Scale Levels <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={addLevelToNewScale}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Plus size={16} />
                    Add Level
                  </button>
                </div>
                {errors.levels && <p className="text-red-500 text-sm mb-2">{errors.levels}</p>}

                <div className="space-y-3">
                  {newScale.levels.map((level, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Value <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={level.value}
                            onChange={(e) => updateNewScaleLevel(index, 'value', e.target.value)}
                            className={`w-full px-3 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                              errors[`level_${index}_value`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., A"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Label <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={level.label}
                            onChange={(e) => updateNewScaleLevel(index, 'label', e.target.value)}
                            className={`w-full px-3 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                              errors[`level_${index}_label`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Excellent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <input
                            type="text"
                            value={level.description}
                            onChange={(e) => updateNewScaleLevel(index, 'description', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="e.g., 80-100%"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeNewScaleLevel(index)}
                        className="mt-2 text-red-600 hover:text-red-700 text-xs flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Remove Level
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewScale({ name: '', description: '', levels: [] });
                    setErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddScale}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save size={20} />
                  Save Scale
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Scales List */}
        <div className="space-y-4">
          {scales.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500">No scales created yet. Click "Add New Scale" to get started.</p>
            </div>
          ) : (
            scales.map(scale => (
              <div key={scale.id} className="bg-white rounded-lg shadow-md p-6">
                {editingId === scale.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scale Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={scale.name || ''}
                        onChange={(e) => updateScale(scale.id, 'name', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={scale.description || ''}
                        onChange={(e) => updateScale(scale.id, 'description', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Scale Levels <span className="text-red-500">*</span>
                        </label>
                        <button
                          onClick={() => addLevelToScale(scale.id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Plus size={16} />
                          Add Level
                        </button>
                      </div>

                      <div className="space-y-3">
                        {scale.levels.map((level, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Value <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={level.value || ''}
                                  onChange={(e) => updateScaleLevel(scale.id, index, 'value', e.target.value)}
                                  className={`w-full px-3 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                    errors[`level_${index}_value`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                />
                                {errors[`level_${index}_value`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`level_${index}_value`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Label <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={level.label || ''}
                                  onChange={(e) => updateScaleLevel(scale.id, index, 'label', e.target.value)}
                                  className={`w-full px-3 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                    errors[`level_${index}_label`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                />
                                {errors[`level_${index}_label`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`level_${index}_label`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                <input
                                  type="text"
                                  value={level.description || ''}
                                  onChange={(e) => updateScaleLevel(scale.id, index, 'description', e.target.value)}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeLevelFromScale(scale.id, index)}
                              className="mt-2 text-red-600 hover:text-red-700 text-xs flex items-center gap-1"
                            >
                              <Trash2 size={14} />
                              Remove Level
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(scale.id)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Check size={20} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">{scale.name}</h3>
                        {scale.description && (
                          <p className="text-gray-600 mt-1">{scale.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          Created: {new Date(scale.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditScale(scale)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteScale(scale.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 px-3 py-1.5 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Scale Levels ({scale.levels.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {scale.levels.map((level, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="font-semibold text-gray-800">{level.value}</div>
                            <div className="text-sm text-gray-700 mt-1">{level.label}</div>
                            {level.description && (
                              <div className="text-xs text-gray-500 mt-1">{level.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScalesManagement;
