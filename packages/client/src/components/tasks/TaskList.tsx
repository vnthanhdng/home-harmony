import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Task } from '../../services/taskService';
import TaskItem from './TaskItem';
import CreateTaskButton from './CreateTaskButton';

interface TaskListProps {
  tasks: Task[];
  unitId: string;
  onStatusChange?: () => void;
  onTaskCreated?: () => void;
  showCreateButton?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  unitId,
  onStatusChange = () => {}, 
  onTaskCreated = () => {},
  showCreateButton = true
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'inProgress' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  // Filter tasks based on selection
  const getFilteredTasks = () => {
    if (filter === 'all') return tasks;
    return tasks.filter(task => task.status === filter);
  };

  const filteredTasks = getFilteredTasks();

  // Group tasks by status for Kanban view
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'inProgress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div>
      {/* Header with filters and view toggle */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex border-b mb-2">
          <button
            className={`px-4 py-2 text-sm font-medium ${filter === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setFilter('all')}
          >
            All Tasks
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${filter === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setFilter('pending')}
          >
            To Do
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${filter === 'inProgress' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setFilter('inProgress')}
          >
            In Progress
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${filter === 'completed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View toggle */}
          <div className="flex border rounded-md">
            <button
              className={`px-3 py-1 text-sm ${viewMode === 'kanban' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
            <button
              className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          {/* Create task button */}
          {showCreateButton && (
            <CreateTaskButton unitId={unitId} onTaskCreated={onTaskCreated} />
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No tasks found. Create your first task to get started!</p>
          {showCreateButton && (
            <CreateTaskButton unitId={unitId} onTaskCreated={onTaskCreated} />
          )}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tasks match the selected filter.
        </div>
      ) : filter !== 'all' || viewMode === 'list' ? (
        // List view for filtered tasks
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onStatusChange={onStatusChange} 
            />
          ))}
        </div>
      ) : (
        // Kanban board view for all tasks
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pending Column */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-3 px-2 flex justify-between items-center">
              <span>To Do ({pendingTasks.length})</span>
              {showCreateButton && (
                <CreateTaskButton 
                  unitId={unitId} 
                  onTaskCreated={onTaskCreated} 
                  compact 
                />
              )}
            </h3>
            <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto p-1">
              {pendingTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onStatusChange={onStatusChange} 
                  compact 
                />
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No pending tasks
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-3 px-2">
              In Progress ({inProgressTasks.length})
            </h3>
            <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto p-1">
              {inProgressTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onStatusChange={onStatusChange} 
                  compact 
                />
              ))}
              {inProgressTasks.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No tasks in progress
                </div>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-3 px-2">
              Completed ({completedTasks.length})
            </h3>
            <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto p-1">
              {completedTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onStatusChange={onStatusChange} 
                  compact 
                />
              ))}
              {completedTasks.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No completed tasks
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;