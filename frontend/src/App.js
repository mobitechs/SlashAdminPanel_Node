import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';

// User Management
import UserManagement from './pages/UserManagement';
import UserForm from './pages/UserForm';
import UserDetails from './pages/UserDetails';
import UserEdit from './pages/UserEdit';

// Store Management
import StoreManagement from './pages/StoreManagement';
import StoreForm from './pages/StoreForm';
import StoreDetails from './pages/StoreDetails';
import StoreEdit from './pages/StoreEdit';

// Coupon Management
import CouponManagement from './pages/CouponManagement';
import CouponForm from './pages/CouponForm';
import CouponDetails from './pages/CouponDetails';
import CouponEdit from './pages/CouponEdit';

// Reward Management
import RewardManagement from './pages/RewardManagement';
import RewardForm from './pages/RewardForm';
import RewardDetails from './pages/RewardDetails';
import RewardEdit from './pages/RewardEdit';

// Import NEW Reward History Components
import RewardHistoryManagement from './pages/RewardHistoryManagement';
import RewardHistoryDetails from './pages/RewardHistoryDetails';

// Transaction Management
import TransactionManagement from './pages/TransactionManagement';
import TransactionDetails from './pages/TransactionDetails';
import TransactionForm from './pages/TransactionForm';
import TransactionEdit from './pages/TransactionEdit';

// 🆕 NEW: Settlement Management
import SettlementManagement from './pages/SettlementManagement';
import SettlementDetails from './pages/SettlementDetails';
import SettlementForm from './pages/SettlementForm';
import SettlementEdit from './pages/SettlementEdit';
import StoreWiseSettlements from './pages/StoreWiseSettlements';

import ContentManagement from './pages/content/ContentManagement';
import FAQManagement from './pages/content/FAQManagement';
import FAQForm from './pages/content/FAQForm';
import TermsManagement from './pages/content/TermsManagement';
import TermsForm from './pages/content/TermsForm';
import VideosManagement from './pages/content/VideosManagement';
import VideosForm from './pages/content/VideosForm';
import TopStoresManagement from './pages/content/TopStoresManagement';
import TopStoresForm from './pages/content/TopStoresForm';

// Survey Management
import SurveyManagement from './pages/SurveyManagement';
import SurveyForm from './pages/SurveyForm';
import SurveyDetails from './pages/SurveyDetails';
import SurveyEdit from './pages/SurveyEdit';

import Loading from './components/common/Loading';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading fullScreen />;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading fullScreen />;
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* User Management Routes */}
              <Route path="users" element={<UserManagement />} />
              <Route path="users/add" element={<UserForm />} />
              <Route path="users/:id" element={<UserDetails />} />
              <Route path="users/:id/edit" element={<UserEdit />} />
              
              {/* Store Management Routes */}
              <Route path="stores" element={<StoreManagement />} />
              <Route path="stores/add" element={<StoreForm />} />
              <Route path="stores/:id" element={<StoreDetails />} />
              <Route path="stores/:id/edit" element={<StoreEdit />} />
              
              {/* Coupon Management Routes */}
              <Route path="coupons" element={<CouponManagement />} />
              <Route path="coupons/add" element={<CouponForm />} />
              <Route path="coupons/:id" element={<CouponDetails />} />
              <Route path="coupons/:id/edit" element={<CouponEdit />} />
              
              {/* Reward Management Routes */}
              <Route path="rewards" element={<RewardManagement />} />
              <Route path="rewards/add" element={<RewardForm />} />
              <Route path="rewards/:id" element={<RewardDetails />} />
              <Route path="rewards/:id/edit" element={<RewardEdit />} />

              {/* Reward History Routes */}
              <Route path="reward-history" element={<RewardHistoryManagement />} />
              <Route path="reward-history/:id" element={<RewardHistoryDetails />} />
              
              {/* Transaction Management Routes */}
              <Route path="transactions" element={<TransactionManagement />} />
              <Route path="transactions/:id" element={<TransactionDetails />} />
              <Route path="transactions/add" element={<TransactionForm />} />
              <Route path="transactions/:id/edit" element={<TransactionEdit />} />

              {/* 🆕 NEW: Settlement Management Routes */}
              <Route path="settlements" element={<SettlementManagement />} />
              <Route path="settlements/:id" element={<SettlementDetails />} />
              <Route path="settlements/add" element={<SettlementForm />} />
              <Route path="settlements/:id/edit" element={<SettlementEdit />} />
              <Route path="/settlements/store/:storeId" element={<StoreWiseSettlements />} />

              {/* Content Management Routes */}
              <Route path="content" element={<ContentManagement />} />

              {/* FAQs Routes */}
              <Route path="content/faqs" element={<FAQManagement />} />
              <Route path="content/faqs/add" element={<FAQForm isEdit={false} />} />
              <Route path="content/faqs/:id/edit" element={<FAQForm isEdit={true} />} />

              {/* Terms & Conditions Routes */}
              <Route path="content/terms" element={<TermsManagement />} />
              <Route path="content/terms/add" element={<TermsForm isEdit={false} />} />
              <Route path="content/terms/:id/edit" element={<TermsForm isEdit={true} />} />

              {/* App Demo Videos Routes */}
              <Route path="content/videos" element={<VideosManagement />} />
              <Route path="content/videos/add" element={<VideosForm isEdit={false} />} />
              <Route path="content/videos/:id/edit" element={<VideosForm isEdit={true} />} />

              {/* Top Stores Routes */}
              <Route path="content/top-stores" element={<TopStoresManagement />} />
              <Route path="content/top-stores/add" element={<TopStoresForm isEdit={false} />} />
              <Route path="content/top-stores/:id/edit" element={<TopStoresForm isEdit={true} />} />

              {/* Survey Management Routes */}
              <Route path="surveys" element={<SurveyManagement />} />
              <Route path="surveys/add" element={<SurveyForm />} />
              <Route path="surveys/:id" element={<SurveyDetails />} />
              <Route path="surveys/:id/edit" element={<SurveyEdit />} />

            </Route>
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;