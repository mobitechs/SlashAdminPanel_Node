// components/common/Input.js
import React from 'react';

const Input = ({ 
  label, 
  error, 
  helperText,
  icon,
  className = '',
  containerClassName = '',
  ...props 
}) => {
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          className={`
            block w-full border border-gray-300 rounded-lg shadow-sm
            focus:ring-blue-500 focus:border-blue-500
            ${icon ? 'pl-10' : 'px-3'} py-2
            ${error ? 'border-red-300 bg-red-50' : ''}
            ${className}
          `.trim()}
          {...props}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Select component
export const Select = ({ 
  label, 
  options = [], 
  error, 
  helperText,
  placeholder = 'Select an option',
  className = '',
  containerClassName = '',
  ...props 
}) => {
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <select
        className={`
          block w-full border border-gray-300 rounded-lg shadow-sm
          focus:ring-blue-500 focus:border-blue-500 px-3 py-2
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${className}
        `.trim()}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
