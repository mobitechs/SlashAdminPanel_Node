// src/components/ContentRoutes.js - NEW FILE - Add this to your project
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Content Management Components
import ContentManagement from '../pages/content/ContentManagement';

// FAQs Components  
import FAQManagement from '../pages/content/FAQManagement';
import FAQForm from '../pages/content/FAQForm';

// Terms Components
import TermsManagement from '../pages/content/TermsManagement';
import TermsForm from '../pages/content/TermsForm';

// Videos Components
import VideosManagement from '../pages/content/VideosManagement';
import VideosForm from '../pages/content/VideosForm';

// Top Stores Components
import TopStoresManagement from '../pages/content/TopStoresManagement';
import TopStoresForm from '../pages/content/TopStoresForm';

const ContentRoutes = () => {
  return (
    <Routes>
      {/* Main Content Management Dashboard */}
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
      
      {/* Survey Routes (placeholder) */}
      <Route path="content/survey" element={
        <div style={{
          padding: '2rem', 
          textAlign: 'center', 
          color: 'var(--text-muted)',
          background: 'var(--bg-glass)',
          borderRadius: 'var(--radius-lg)',
          margin: '2rem'
        }}>
          <h2>Survey Management</h2>
          <p>Coming Soon...</p>
        </div>
      } />
    </Routes>
  );
};

export default ContentRoutes;