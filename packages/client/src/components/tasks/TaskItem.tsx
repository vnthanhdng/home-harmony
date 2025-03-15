import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isAfter } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '../../services/taskService';
import taskService from '../../services/taskService';
import { toast } from 'react-toastify';
import {useAuth} from '../../contexts/AuthContext';
import TaskStatusBadge from './TaskStatusBadge';

interface TaskItemProps {
  task: Task;
  onStatusChange?: () => void;
  compact?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onStatusChange,
  compact = false 
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const isAssignee = task.assigneeId === user?.id;
  const isCreator = task.creatorId === user?.id;
  
  // Format due date if present
  const formattedDueDate = task.dueDate 
    ? format(parseISO(task.dueDate), 'MMM d, yyyy')
    : null;
  
  // Check if task is overdue
  const isOverdue = () => {
    if (!task.dueDate || task.status === 'completed') return false;
    return isAfter(new Date(), parseISO(task.dueDate));
  };
  
  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => taskService.updateTaskStatus(task.id, status),
    onSuccess: () => {
      if (onStatusChange) {
        onStatusChange();
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', task.unitId] });
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      
      setMenuOpen(false);
      toast.success('Task status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update task status');
    }
  });
  
  // Handle status change
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  // Handle click outside to close menu
  React.useEffect(() => {
    if (menuOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setMenuOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  const menuRef = React.useRef<HTMLDivElement>(null);

  return (
    <div 
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${
        task.status === 'completed' 
          ? 'border-green-500'
          : isOverdue() 
            ? 'border-red-500' 
            : 'border-blue-500'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className={compact ? 'w-3/4' : 'w-full'}>
          <Link 
            to={`/tasks/${task.id}`}
            className="font-medium text-gray-900 hover:text-blue-600"
          >
            {task.title}
          </Link>
          
          {!compact && task.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            
            {formattedDueDate && (
              <span className={`text-xs ${isOverdue() ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                {isOverdue() ? 'Overdue: ' : 'Due: '}
                {formattedDueDate}
              </span>
            )}
            
            {task.assignee && (
              <span className="text-xs text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {task.assignee.username}
              </span>
            )}
            
            {task.completionMedia && task.completionMedia.length > 0 && (
              <span className="text-xs text-green-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Evidence
              </span>
            )}
          </div>
        </div>
        
        {/* Task dropdown menu */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Task options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                {/* Status change options */}
                {task.status !== 'pending' && (
                  <button
                    onClick={() => handleStatusChange('pending')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark as To Do
                  </button>
                )}
                
                {task.status !== 'inProgress' && (
                  <button
                    onClick={() => handleStatusChange('inProgress')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark as In Progress
                  </button>
                )}
                
                {task.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark as Completed
                  </button>
                )}
                
                <Link
                  to={`/tasks/${task.id}`}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View Details
                </Link>
                
                {task.status !== 'completed' && isAssignee && (
                  <Link
                    to={`/tasks/${task.id}/complete`}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Complete with Evidence
                  </Link>
                )}
                
                {(isCreator || isAssignee) && (
                  <Link
                    to={`/tasks/${task.id}/edit`}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit Task
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;