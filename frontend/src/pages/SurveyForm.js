// pages/SurveyForm.js - Create New Survey Page
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Save, X, FileText, Tag, Award, Star,
  Target, AlertCircle, Plus, Trash2, HelpCircle
} from 'lucide-react';
import '../styles/AdminStyles.css';

const SurveyForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  // Validation errors
  const [errors, setErrors] = useState({});

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
  
  const getAuthToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('accessToken') ||
           sessionStorage.getItem('token') ||
           sessionStorage.getItem('authToken');
  };

  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

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

    // Clear error for this question
    if (errors[`question_${index}`]) {
      setErrors(prev => ({
        ...prev,
        [`question_${index}`]: ''
      }));
    }
  };

  // Add new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        question_type: 'text',
        options: '',
        is_required: 0,
        display_order: questions.length + 1
      }
    ]);
  };

  // Remove question
  const removeQuestion = (index) => {
    if (window.confirm('Are you sure you want to remove this question?')) {
      const updatedQuestions = questions.filter((_, i) => i !== index);
      setQuestions(updatedQuestions.map((q, i) => ({ ...q, display_order: i + 1 })));
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
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Prepare create data
      const createData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        reward_points: parseFloat(formData.reward_points),
        is_active: formData.is_active,
        questions: questions.map(q => ({
          question: q.question.trim(),
          question_type: q.question_type,
          options: q.options.trim() || null,
          is_required: q.is_required,
          display_order: q.display_order
        }))
      };

      console.log('🔄 Creating new survey with data:', createData);

      const response = await fetch(`${API_BASE_URL}/surveys`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(createData)
      });

      console.log(`📡 Create response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Create result:', result);
      
      if (result.success) {
        alert('Survey created successfully!');
        navigate('/surveys');
      } else {
        throw new Error(result.message || 'Survey creation failed');
      }

    } catch (error) {
      console.error('❌ Create failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Create Form Layout */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Create New Survey</h3>
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
                  <div key={index} style={{
                    padding: 'var(--spacing-lg)',
                    background: 'var(--bg-glass-light)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-glass)'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)'}}>
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
                      <button 
                        type="button"
                        className="action-btn delete"
                        onClick={() => removeQuestion(index)}
                        title="Remove Question"
                      >
                        <Trash2 size={14} />
                      </button>
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
                        <label className="form-label">Options (comma-separated)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Option 1, Option 2, Option 3"
                          value={question.options}
                          onChange={(e) => handleQuestionChange(index, 'options', e.target.value)}
                        />
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
        <Link to="/surveys" className="btn btn-secondary">
          <X size={16} />
          Cancel
        </Link>
        <button 
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner-ring" style={{
                width: '16px', 
                height: '16px', 
                border: '2px solid rgba(255,255,255,0.3)', 
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Creating...
            </>
          ) : (
            <>
              <Save size={16} />
              Create Survey
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SurveyForm;