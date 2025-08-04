// pages/SurveyEdit.js - Enhanced Edit Survey Page with Question Management
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Save, X, FileText, Tag, Award, Star,
  Target, AlertCircle, Plus, Trash2, HelpCircle, Edit2
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const SurveyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward_points: '',
    is_active: 1
  });

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [questionsToDelete, setQuestionsToDelete] = useState([]);

  // Validation errors
  const [errors, setErrors] = useState({});

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
  
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Question type options
  const questionTypeOptions = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'radio', label: 'Single Choice' },
    { value: 'checkbox', label: 'Multiple Choice' },
    { value: 'select', label: 'Dropdown' },
    { value: 'rating', label: 'Rating Scale' },
    { value: 'number', label: 'Number Input' },
    { value: 'email', label: 'Email Input' }
  ];

  // Fetch survey data for editing
  const fetchSurveyData = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching survey data for editing, ID: ${id}`);
      
      const response = await fetch(`${API_BASE_URL}/surveys/${id}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });

      console.log(`📡 Survey edit response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Survey with ID ${id} not found`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Survey Edit API Response:', data);

      if (!data.success || !data.data || !data.data.survey) {
        throw new Error('Invalid API response format');
      }

      const surveyData = data.data.survey;
      const questionsData = data.data.questions || [];
      
      if (!surveyData.id || surveyData.id != id) {
        throw new Error(`Survey ID mismatch: expected ${id}, got ${surveyData.id}`);
      }
      
      // Set form data with all fields
      setFormData({
        title: surveyData.title || '',
        description: surveyData.description || '',
        reward_points: surveyData.reward_points || '',
        is_active: surveyData.is_active || 1
      });

      // Set questions data
      setQuestions(questionsData.map(q => ({
        id: q.id,
        question: q.question,
        question_type: q.question_type,
        options: q.options || '',
        is_required: q.is_required || 0,
        display_order: q.display_order || 1,
        isNew: false
      })));
      
      console.log('✅ Survey edit data loaded successfully for survey:', surveyData.id);

    } catch (error) {
      console.error(`❌ Failed to fetch survey ${id} for editing:`, error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyData();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let newValue = value;
    if (type === 'checkbox') {
      newValue = checked ? 1 : 0;
    } else if (type === 'number') {
      newValue = value === '' ? '' : parseFloat(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle question changes
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: field === 'is_required' ? (value ? 1 : 0) : value
    };
    setQuestions(updatedQuestions);
  };

  // Add new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: null,
        question: '',
        question_type: 'text',
        options: '',
        is_required: 0,
        display_order: questions.length + 1,
        isNew: true
      }
    ]);
  };

  // Remove question
  const removeQuestion = (index) => {
    const questionToRemove = questions[index];
    
    if (window.confirm('Are you sure you want to remove this question?')) {
      // If it's an existing question (has ID), add to delete list
      if (questionToRemove.id && !questionToRemove.isNew) {
        setQuestionsToDelete(prev => [...prev, questionToRemove.id]);
      }
      
      // Remove from questions array
      const updatedQuestions = questions.filter((_, i) => i !== index);
      setQuestions(updatedQuestions.map((q, i) => ({ ...q, display_order: i + 1 })));
    }
  };

  // Delete question immediately (for delete button in question list)
  const deleteQuestionImmediately = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/surveys/${id}/questions/${questionId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        // Remove from questions array
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        alert('Question deleted successfully');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete question error:', error);
      alert('Failed to delete question. Please try again.');
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.title.trim()) {
      newErrors.title = 'Survey title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Survey title must be 255 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Survey description is required';
    }

    // Reward points validation
    if (!formData.reward_points || formData.reward_points < 0) {
      newErrors.reward_points = 'Reward points is required and must be 0 or greater';
    }

    // Validate questions
    questions.forEach((question, index) => {
      if (!question.question.trim()) {
        newErrors[`question_${index}`] = `Question ${index + 1} text is required`;
      }
      
      // Validate options for choice-based questions
      if (['radio', 'checkbox', 'select'].includes(question.question_type) && !question.options.trim()) {
        newErrors[`options_${index}`] = `Question ${index + 1} options are required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      // Step 1: Update survey basic info
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        reward_points: parseFloat(formData.reward_points),
        is_active: formData.is_active
      };

      console.log(`🔄 Updating survey ${id} with data:`, updateData);

      const surveyResponse = await fetch(`${API_BASE_URL}/surveys/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!surveyResponse.ok) {
        const errorData = await surveyResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Survey update failed: HTTP ${surveyResponse.status}`);
      }

      // Step 2: Delete questions marked for deletion
      for (const questionId of questionsToDelete) {
        try {
          await fetch(`${API_BASE_URL}/surveys/${id}/questions/${questionId}`, {
            method: 'DELETE',
            headers: getHeaders(),
            credentials: 'include'
          });
          console.log(`✅ Deleted question ${questionId}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete question ${questionId}:`, error);
        }
      }

      // Step 3: Process existing and new questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionData = {
          question: question.question.trim(),
          question_type: question.question_type,
          options: question.options.trim() || null,
          is_required: question.is_required,
          display_order: i + 1
        };

        if (question.id && !question.isNew) {
          // Update existing question
          try {
            const questionResponse = await fetch(`${API_BASE_URL}/surveys/${id}/questions/${question.id}`, {
              method: 'PUT',
              headers: getHeaders(),
              body: JSON.stringify(questionData)
            });
            
            if (questionResponse.ok) {
              console.log(`✅ Updated question ${question.id}`);
            } else {
              console.warn(`⚠️ Failed to update question ${question.id}`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to update question ${question.id}:`, error);
          }
        } else {
          // Create new question
          try {
            const questionResponse = await fetch(`${API_BASE_URL}/surveys/${id}/questions`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(questionData)
            });
            
            if (questionResponse.ok) {
              console.log(`✅ Created new question ${i + 1}`);
            } else {
              console.warn(`⚠️ Failed to create question ${i + 1}`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to create question ${i + 1}:`, error);
          }
        }
      }

      alert('Survey updated successfully!');
      navigate(`/surveys/${id}`); // Navigate to details page

    } catch (error) {
      console.error('❌ Update failed:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Survey #{id}...</p>
        </div>
      </div>
    );
  }

  // Show error state if API failed and no form data loaded
  if (error && (!formData.title && !formData.description)) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Cannot Edit Survey"
            message={error}
            onRetry={fetchSurveyData}
            backTo="/surveys"
            backText="Back to Surveys List"
            debugInfo={{
              "Survey ID": id,
              "API Base URL": API_BASE_URL,
              "Expected Endpoint": `${API_BASE_URL}/surveys/${id}`,
              "Error": error
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{paddingBottom: '100px'}}>
      {error && (
        <div style={{
          background: 'var(--error-bg)',
          border: '1px solid var(--error-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)'
        }}>
          <AlertCircle size={20} style={{color: 'var(--error-text)'}} />
          <span style={{color: 'var(--error-text)'}}>{error}</span>
        </div>
      )}

      {/* Edit Form Layout */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Edit Survey #{id}</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Basic Information */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <FileText size={18} />
              Basic Information
            </h4>
            
            {/* Survey Title */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Survey Title *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="e.g., Customer Satisfaction Survey"
                value={formData.title}
                onChange={handleInputChange}
                maxLength="255"
                style={{borderColor: errors.title ? 'var(--error-border)' : undefined}}
              />
              {errors.title && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.title}
                </span>
              )}
            </div>

            {/* Survey Description */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Survey Description *</label>
              <textarea
                name="description"
                className="form-input"
                placeholder="Describe what this survey is about..."
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                style={{borderColor: errors.description ? 'var(--error-border)' : undefined}}
              />
              {errors.description && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.description}
                </span>
              )}
            </div>

            {/* Reward Points */}
            <div className="form-group">
              <label className="form-label">
                <Award size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Reward Points *
              </label>
              <input
                type="number"
                name="reward_points"
                className="form-input"
                placeholder="e.g., 50"
                value={formData.reward_points}
                onChange={handleInputChange}
                min="0"
                step="1"
                style={{borderColor: errors.reward_points ? 'var(--error-border)' : undefined}}
              />
              {errors.reward_points && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.reward_points}
                </span>
              )}
            </div>
          </div>

          {/* Questions Section */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
              <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                <HelpCircle size={18} />
                Survey Questions ({questions.length})
              </h4>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={addQuestion}
                style={{fontSize: '0.875rem'}}
              >
                <Plus size={16} />
                Add Question
              </button>
            </div>

            {questions.length > 0 ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                {questions.map((question, index) => (
                  <div key={question.id || `new-${index}`} style={{
                    padding: 'var(--spacing-lg)',
                    background: 'var(--bg-glass-light)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-glass)'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                        <span style={{
                          background: 'var(--primary-bg)',
                          color: 'var(--primary-text)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          Question {index + 1}
                        </span>
                        {question.isNew && (
                          <span style={{
                            background: 'var(--success-bg)',
                            color: 'var(--success-text)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <div style={{display: 'flex', gap: 'var(--spacing-xs)'}}>
                        {question.id && !question.isNew && (
                          <button 
                            type="button"
                            className="action-btn delete"
                            onClick={() => deleteQuestionImmediately(question.id)}
                            title="Delete Question from Database"
                            style={{background: 'var(--error-bg)', borderColor: 'var(--error-border)'}}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button 
                          type="button"
                          className="action-btn delete"
                          onClick={() => removeQuestion(index)}
                          title="Remove Question"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)'}}>
                      <div className="form-group">
                        <label className="form-label">Question Text *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter your question..."
                          value={question.question}
                          onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                          style={{borderColor: errors[`question_${index}`] ? 'var(--error-border)' : undefined}}
                        />
                        {errors[`question_${index}`] && (
                          <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                            {errors[`question_${index}`]}
                          </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Question Type</label>
                        <select
                          className="form-input"
                          value={question.question_type}
                          onChange={(e) => handleQuestionChange(index, 'question_type', e.target.value)}
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {questionTypeOptions.map(option => (
                            <option 
                              key={option.value} 
                              value={option.value}
                              style={{backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'}}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(question.question_type === 'radio' || question.question_type === 'checkbox' || question.question_type === 'select') && (
                      <div className="form-group" style={{marginBottom: 'var(--spacing-md)'}}>
                        <label className="form-label">Options (comma-separated) *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Option 1, Option 2, Option 3"
                          value={question.options}
                          onChange={(e) => handleQuestionChange(index, 'options', e.target.value)}
                          style={{borderColor: errors[`options_${index}`] ? 'var(--error-border)' : undefined}}
                        />
                        {errors[`options_${index}`] && (
                          <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                            {errors[`options_${index}`]}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <input
                        type="checkbox"
                        id={`required_${index}`}
                        className="checkbox-input"
                        checked={question.is_required === 1}
                        onChange={(e) => handleQuestionChange(index, 'is_required', e.target.checked)}
                      />
                      <label htmlFor={`required_${index}`} style={{color: 'var(--text-secondary)', cursor: 'pointer'}}>
                        Required Question
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
                background: 'var(--bg-glass-light)',
                borderRadius: 'var(--radius-lg)',
                border: '2px dashed var(--border-glass)'
              }}>
                <HelpCircle size={32} style={{color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)'}} />
                <p style={{color: 'var(--text-muted)', margin: 0}}>
                  No questions added yet. Click "Add Question" to get started.
                </p>
              </div>
            )}
          </div>

          {/* Status Settings */}
          <div style={{padding: 'var(--spacing-lg)', background: 'var(--bg-glass-light)', borderRadius: 'var(--radius-lg)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Target size={18} />
              Status Settings
            </h4>
            <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                className="checkbox-input"
                checked={formData.is_active === 1}
                onChange={handleInputChange}
              />
              <label htmlFor="is_active" style={{color: 'var(--text-secondary)', cursor: 'pointer'}}>
                Survey Active
              </label>
            </div>
          </div>
        </form>
      </div>

      {/* Floating Action Buttons */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: 'var(--spacing-md)',
        zIndex: 1000,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <Link to={`/surveys/${id}`} className="btn btn-secondary">
          <X size={16} />
          Cancel
        </Link>
        <button 
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="spinner-ring" style={{
                width: '16px', 
                height: '16px', 
                border: '2px solid rgba(255,255,255,0.3)', 
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SurveyEdit;