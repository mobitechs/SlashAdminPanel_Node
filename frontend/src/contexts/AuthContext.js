import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('adminToken'),
  loading: true,
  error: null,
};

// Create context
const AuthContext = createContext();

// Simple reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.admin,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        localStorage.setItem('adminToken', response.token);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: response,
        });
        return { success: true };
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: response.message,
        });
        return { success: false, error: response.message };
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('adminToken');
    dispatch({ type: 'LOGOUT' });
  };

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Simulate token verification
      setTimeout(() => {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            admin: {
              id: 1,
              firstName: 'Admin',
              lastName: 'User',
              email: 'admin@slashapp.com',
              role: 'super_admin',
            },
            token: token,
          },
        });
      }, 500);
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const clearError = () => {
    // Implementation for clearing error
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};