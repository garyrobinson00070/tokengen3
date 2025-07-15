import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'white';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  text,
  fullScreen = false
}) => {
  // Size mappings
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };
  
  // Color mappings
  const colorMap = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    purple: 'border-purple-500',
    white: 'border-white'
  };
  
  const spinnerClasses = `${sizeMap[size]} ${colorMap[color]} border-t-transparent rounded-full animate-spin`;
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className={spinnerClasses + ' mx-auto'}></div>
          {text && <p className="mt-4 text-white">{text}</p>}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center">
      <div className={spinnerClasses}></div>
      {text && <span className="ml-3 text-white">{text}</span>}
    </div>
  );
};