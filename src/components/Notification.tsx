import React, { useState, useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out">
      <div className={`${getBackgroundColor()} text-white px-4 py-2 rounded-lg shadow-lg flex items-center`}>
        <span>{message}</span>
        <button 
          className="ml-3 text-white focus:outline-none" 
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Notification; 