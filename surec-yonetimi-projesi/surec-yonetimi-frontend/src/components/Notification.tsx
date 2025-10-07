// src/components/Notification.tsx

import React from 'react';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  return (
    <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg mb-4 flex justify-between items-center">
      <span>{message}</span>
      <button onClick={onClose} className="text-white font-bold">
        &times;
      </button>
    </div>
  );
};

export default Notification;