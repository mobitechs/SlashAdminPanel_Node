// pages/SurveyDetails.js - Complete Survey Details Page with Question Management
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, Tag, Calendar, Clock,
  FileText, Shield, Target, CheckCircle, Award, Star, 
  Activity, Home, ChevronRight, Eye, Users, TrendingUp, Plus,
  MessageSquare, HelpCircle, Edit2
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const SurveyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for showing full lists
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [showAllResponses, setShowAllResponses] = useState(false);

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

  // Fetch survey details
  const fetchSurveyDetails = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching survey details for ID: ${id}`);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/surveys/${id}`,
        `/api/surveys/${id}`,
        `/surveys/${id}`
      ];

      let lastError = null;
      let surveyData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying survey details endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          console.log(`📡 Survey details response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Survey Details API Response:', JSON.stringify(data, null, 2));
            surveyData = data;
            break;
          } else if (response.status === 404) {
            throw new Error(`Survey with ID ${id} not found`);
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Survey details endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Survey details endpoint ${endpoint} error:`, err.message);
          lastError = err;
          
          if (err.message.includes('not found') || err.message.includes('404')) {
            throw err;
          }
          continue;
        }
      }

      if (!surveyData) {
        throw lastError || new Error(`Failed to fetch survey data for ID: ${id}. Please check if the survey exists.`);
      }

      const processedSurvey = processSurveyData(surveyData);
      if (!processedSurvey.id) {
        throw new Error(`Invalid survey data received for ID: ${id}`);
      }
      
      setSurvey(processedSurvey);
      console.log('✅ Survey details loaded successfully:', processedSurvey);

    } catch (error) {
      console.error(`❌ Failed to fetch survey ${id}:`, error.message);
      setError(error.message);
      setSurvey(null);
    } finally {
      setLoading(false);
    }
  };

  // Process survey data from API response
  const processSurveyData = (rawData) => {
    try {
      console.log('🔍 Processing raw API data:', rawData);
      
      let surveyData = null;
      let questions = [];
      let responses = [];
      
      // Handle backend structure: { success: true, data: { survey: {...}, questions: [...], recentResponses: [...] } }
      if (rawData.success && rawData.data) {
        surveyData = rawData.data.survey || rawData.data;
        
        // Get questions and responses from the correct location
        questions = rawData.data.questions || [];
        responses = rawData.data.recentResponses || [];
      } else if (rawData.survey) {
        surveyData = rawData.survey;
        questions = rawData.questions || [];
        responses = rawData.recentResponses || [];
      } else if (rawData.id) {
        surveyData = rawData;
        questions = rawData.questions || [];
        responses = rawData.recentResponses || [];
      } else {
        console.error('❌ Unrecognized API response structure:', rawData);
        throw new Error('Invalid API response format - no survey data found');
      }

      console.log('🔍 Extracted survey data:', surveyData);
      console.log('🔍 Extracted questions:', questions);
      console.log('🔍 Extracted responses:', responses);

      if (!surveyData) {
        throw new Error('Survey data is null or undefined');
      }

      if (!surveyData.id) {
        console.error('❌ Survey data missing ID field:', surveyData);
        throw new Error('Survey data missing required ID field');
      }

      if (surveyData.id != id) {
        throw new Error(`Survey ID mismatch: expected ${id}, got ${surveyData.id}`);
      }

      // Attach questions and responses data to survey
      surveyData.questions = Array.isArray(questions) ? questions : [];
      surveyData.recentResponses = Array.isArray(responses) ? responses : [];

      console.log('✅ Final processed survey data:');
      console.log('📊 Questions found:', surveyData.questions.length);
      console.log('📊 Responses found:', surveyData.recentResponses.length);
      
      return surveyData;
    } catch (error) {
      console.error('❌ Error processing survey data:', error);
      console.error('Raw data that caused error:', rawData);
      throw error;
    }
  };

  useEffect(() => {
    fetchSurveyDetails();
  }, [id]);

  // Functions to get limited lists
  const getDisplayedQuestions = () => {
    if (!survey?.questions || !Array.isArray(survey.questions)) {
      return [];
    }
    return showAllQuestions ? survey.questions : survey.questions.slice(0, 10);
  };

  const getDisplayedResponses = () => {
    if (!survey?.recentResponses || !Array.isArray(survey.recentResponses)) {
      return [];
    }
    return showAllResponses ? survey.recentResponses : survey.recentResponses.slice(0, 10);
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getSurveyStatus = (survey) => {
    if (!survey.is_active) return { status: 'Inactive', color: 'error' };
    return { status: 'Active', color: 'success' };
  };

  const getQuestionTypeDisplay = (questionType) => {
    const typeMap = {
      'text': 'Text Input',
      'textarea': 'Long Text',
      'radio': 'Single Choice',
      'checkbox': 'Multiple Choice',
      'select': 'Dropdown',
      'rating': 'Rating Scale',
      'number': 'Number Input',
      'email': 'Email Input'
    };
    return typeMap[questionType] || questionType;
  };

  const handleDeleteSurvey = async () => {
    if (!window.confirm('Are you sure you want to deactivate this survey? This will set its status to inactive.')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/surveys/${id}`,
        `${API_BASE_URL}/admin/surveys/${id}`,
        `/api/surveys/${id}`
      ];

      let deleted = false;
      for (const endpoint of deleteEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify({ is_active: 0 })
          });

          if (response.ok) {
            deleted = true;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (deleted) {
        alert('Survey deactivated successfully');
        navigate('/surveys');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate survey. Please try again.');
    }
  };

  // Handle delete question
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/surveys/${id}/questions/${questionId}`,
        `/api/surveys/${id}/questions/${questionId}`
      ];

      let deleted = false;
      for (const endpoint of deleteEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            deleted = true;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (deleted) {
        await fetchSurveyDetails(); // Refresh the survey data
        alert('Question deleted successfully');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete question error:', error);
      alert('Failed to delete question. Please try again.');
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

  // Show error state if API failed and no survey data
  if (error && !survey) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Failed to Load Survey"
            message={error}
            onRetry={fetchSurveyDetails}
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

  if (!survey) {
    return (
      <div className="page-container">
        <ErrorState
          title="Survey not found"
          message={`Survey #${id} does not exist in the database`}
          showRetry={false}
          backTo="/surveys"
          backText="Back to Surveys"
          showDebugInfo={false}
        />
      </div>
    );
  }

  const status = getSurveyStatus(survey);

  return (
    <div className="page-container">
      {/* Header with Survey Info and Action Buttons */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 'var(--spacing-xl)',
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-glass)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)'
      }}>
        <h1 style={{
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)'
        }}>
          <FileText size={24} style={{color: 'var(--text-muted)'}} />
          #{survey.id} {survey.title}
        </h1>
        
        <div style={{display: 'flex', gap: 'var(--spacing-md)'}}>
          <Link to={`/surveys/${survey.id}/edit`} className="btn btn-secondary">
            <Edit size={16} />
            Edit Survey
          </Link>
          <button 
            className="btn btn-secondary"
            onClick={handleDeleteSurvey}
            style={{background: 'var(--error-bg)', borderColor: 'var(--error-border)', color: 'var(--error-text)'}}
          >
            <Trash2 size={16} />
            Deactivate
          </button>
        </div>
      </div>

      {/* Survey Stats */}
      <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--spacing-xl)'}}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Reward Points</h3>
              <div className="stat-value">{survey.reward_points || 0}</div>
              <p className="stat-subtitle">Points per completion</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-orange)'}}>
              <Award />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Questions</h3>
              <div className="stat-value">{survey.total_questions || 0}</div>
              <p className="stat-subtitle">Survey questions</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-blue)'}}>
              <HelpCircle />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Participants</h3>
              <div className="stat-value">{survey.total_participants || 0}</div>
              <p className="stat-subtitle">Unique users</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-green)'}}>
              <Users />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Responses</h3>
              <div className="stat-value">{survey.total_responses || 0}</div>
              <p className="stat-subtitle">All answers</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-purple)'}}>
              <MessageSquare />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="chart-card">
        <div style={{display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: 'var(--spacing-lg)'}}>
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <FileText size={16} />
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'questions' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'questions' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <HelpCircle size={16} />
            Questions ({(survey.questions && survey.questions.length) || 0})
          </button>
          <button 
            className={`tab-button ${activeTab === 'responses' ? 'active' : ''}`}
            onClick={() => setActiveTab('responses')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'responses' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'responses' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <MessageSquare size={16} />
            Responses ({(survey.recentResponses && survey.recentResponses.length) || 0})
          </button>
        </div>

        <div style={{padding: 'var(--spacing-lg)'}}>
          {activeTab === 'overview' && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)'}}>
              {/* Survey Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Tag size={18} />
                  Survey Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <FileText size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Survey Title</div>
                      <div style={{color: 'var(--text-secondary)', fontWeight: '600'}}>{survey.title}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)'}}>
                    <MessageSquare size={16} style={{color: 'var(--text-muted)', marginTop: '2px'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Description</div>
                      <div style={{color: 'var(--text-secondary)', lineHeight: '1.5'}}>{survey.description}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Shield size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Status</div>
                      <div style={{color: status.color === 'success' ? 'var(--success-text)' : 'var(--error-text)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)'}}>
                        <CheckCircle size={14} />
                        {status.status}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reward Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Award size={18} />
                  Reward Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Award size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Reward Points</div>
                      <div style={{color: 'var(--warning-text)', fontWeight: '600'}}>{survey.reward_points || 0} points</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Activity size={18} />
                  Usage Statistics
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <HelpCircle size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Total Questions</div>
                      <div style={{color: 'var(--text-secondary)', fontWeight: '600'}}>{survey.total_questions || 0}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Users size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Total Participants</div>
                      <div style={{color: 'var(--info-text)', fontWeight: '600'}}>{survey.total_participants || 0}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Created On</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDate(survey.created_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0}}>
                  Survey Questions
                </h3>
                <Link to={`/surveys/${survey.id}/edit`} className="btn btn-primary" style={{fontSize: '0.875rem'}}>
                  <Plus size={16} />
                  Add Question
                </Link>
              </div>
              
              {getDisplayedQuestions().length > 0 ? (
                <>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                    {getDisplayedQuestions().map((question, index) => (
                      <div key={question.id} style={{
                        padding: 'var(--spacing-lg)',
                        background: 'var(--bg-glass-light)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-glass)'
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                            <span style={{
                              background: 'var(--primary-bg)',
                              color: 'var(--primary-text)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              Q{question.display_order || index + 1}
                            </span>
                            <span className={`status-badge ${question.is_required ? 'error' : 'secondary'}`} style={{fontSize: '0.75rem'}}>
                              {question.is_required ? 'Required' : 'Optional'}
                            </span>
                            <span className="role-badge" style={{fontSize: '0.75rem'}}>
                              {getQuestionTypeDisplay(question.question_type)}
                            </span>
                          </div>
                          <div className="action-buttons">
                            <Link
                              to={`/surveys/${survey.id}/edit`}
                              className="action-btn edit"
                              title="Edit Survey & Questions"
                            >
                              <Edit2 size={14} />
                            </Link>
                            <button 
                              className="action-btn delete"
                              onClick={() => handleDeleteQuestion(question.id)}
                              title="Delete Question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h4 style={{fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', margin: '0 0 var(--spacing-sm) 0'}}>
                          {question.question}
                        </h4>
                        {question.options && (
                          <div style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                            <strong>Options:</strong> {question.options}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* See More/Show Less Button for Questions */}
                  {survey.questions && survey.questions.length > 10 && (
                    <div style={{textAlign: 'center', marginTop: 'var(--spacing-lg)'}}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowAllQuestions(!showAllQuestions)}
                        style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', margin: '0 auto'}}
                      >
                        {showAllQuestions ? (
                          <>
                            <Eye size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronRight size={16} />
                            See More ({survey.questions.length - 10} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  padding: 'var(--spacing-xl)',
                  textAlign: 'center',
                  background: 'var(--bg-glass-light)',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px dashed var(--border-glass)'
                }}>
                  <HelpCircle size={32} style={{color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)'}} />
                  <h4 style={{color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)'}}>No questions found</h4>
                  <p style={{color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)'}}>
                    This survey doesn't have any questions yet.
                  </p>
                  <Link to={`/surveys/${survey.id}/edit`} className="btn btn-primary">
                    <Plus size={16} />
                    Add First Question
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'responses' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0}}>
                  Survey Responses
                </h3>
                {survey.recentResponses && survey.recentResponses.length > 10 && !showAllResponses && (
                  <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                    Showing {Math.min(10, survey.recentResponses.length)} of {survey.recentResponses.length} responses
                  </span>
                )}
              </div>
              
              {getDisplayedResponses().length > 0 ? (
                <>
                  <div style={{overflowX: 'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Question</th>
                          <th>Answer</th>
                          <th>Question Type</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDisplayedResponses().map((response) => (
                          <tr key={response.id}>
                            <td>
                              <div>
                                <div style={{fontWeight: '500'}}>{response.user_name || 'Anonymous'}</div>
                                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{response.email}</div>
                              </div>
                            </td>
                            <td style={{maxWidth: '200px'}}>
                              <div style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {response.question}
                              </div>
                            </td>
                            <td style={{maxWidth: '150px'}}>
                              <div style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: '500'
                              }}>
                                {response.answer}
                              </div>
                            </td>
                            <td>
                              <span className="role-badge">
                                {getQuestionTypeDisplay(response.question_type)}
                              </span>
                            </td>
                            <td className="date-cell">{formatDateTime(response.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* See More/Show Less Button for Responses */}
                  {survey.recentResponses && survey.recentResponses.length > 10 && (
                    <div style={{textAlign: 'center', marginTop: 'var(--spacing-lg)'}}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowAllResponses(!showAllResponses)}
                        style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', margin: '0 auto'}}
                      >
                        {showAllResponses ? (
                          <>
                            <Eye size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronRight size={16} />
                            See More ({survey.recentResponses.length - 10} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <ErrorState
                  title="No responses found"
                  message="This survey hasn't received any responses yet."
                  showRetry={false}
                  showBackButton={false}
                  showDebugInfo={false}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyDetails;