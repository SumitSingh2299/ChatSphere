import React from 'react';

const Notification = ({ message, type }) => {
  // Determine the color of the notification based on its type (success or error)
  const baseClasses = "fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white font-semibold";
  const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {message}
    </div>
  );
};

export default Notification;