import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'text-orange-500' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };
  
  return (
    <div className="flex justify-center items-center py-4">
      <div className={`animate-spin rounded-full border-t-transparent border-4 ${sizeClasses[size]} ${color}`}></div>
    </div>
  );
};

export default LoadingSpinner; 