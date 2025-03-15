import React from 'react';

interface TaskStatusBadgeProps {
  status: 'pending' | 'inProgress' | 'completed';
  size?: 'sm' | 'md';
}

const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, size = 'sm' }) => {
  // Define styles based on status
  const getStatusStyles = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inProgress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get display text
  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'To Do';
      case 'inProgress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  // Size classes
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-sm';

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${getStatusStyles()} ${sizeClasses}`}
    >
      {getStatusText()}
    </span>
  );
};

export default TaskStatusBadge;