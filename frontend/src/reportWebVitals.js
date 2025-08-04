// frontend/src/reportWebVitals.js
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    try {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        if (getCLS) getCLS(onPerfEntry);
        if (getFID) getFID(onPerfEntry);
        if (getFCP) getFCP(onPerfEntry);
        if (getLCP) getLCP(onPerfEntry);
        if (getTTFB) getTTFB(onPerfEntry);
      }).catch(() => {
        // Silently fail if web-vitals is not available
        console.log('Web Vitals not available');
      });
    } catch (error) {
      // Silently fail
      console.log('Web Vitals error:', error);
    }
  }
};

export default reportWebVitals;