import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useUnitContext } from '../contexts/UnitContext';

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const { currentUnit } = useUnitContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assigneeId, setAssigneeId] = useState<string>('');
  
  // Fetch task details
  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await axios.get(`/api/tasks/${taskId}`);
      return response.data;
    },
    enabled: !!taskId,
  });

  // Fetch unit members for assignment
  const { data: unitMembers } = useQuery({
    queryKey: ['unitMembers', task?.unitId],
    queryFn: async () => {
      if (!task?.unitId) return [];
      const response = await axios.get(`/api/units/${task.unitId}/members`);
      return response.data;
    },
    enabled: !!task?.unitId,
  });

  // Task status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await axios.patch(`/api/tasks/${taskId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', task?.unitId] });
    }
  });

  // Task assignment mutation
  const assignTaskMutation = useMutation({
    mutationFn: async (newAssigneeId: string) => {
      const response = await axios.patch(`/api/tasks/${taskId}/assign`, { assigneeId: newAssigneeId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', task?.unitId] });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task?.unitId] });
      navigate('/dashboard');
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
          Error loading task details. The task may have been deleted or you don't have permission to view it.
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isAssignee = task.assigneeId === user?.id;
  const isCreator = task.creatorId === user?.id;
  
  // Format dates
  const formattedDueDate = task.dueDate 
    ? format(new Date(task.dueDate), 'MMMM d, yyyy h:mm a')
    : 'No due date';
    
  const formattedCreatedDate = format(new Date(task.createdAt), 'MMMM d, yyyy h:mm a');
  
  // Calculate if task is overdue
  const isOverdue = () => {
    if (!task.dueDate) return false;
    if (task.status === 'completed') return false;
    
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return dueDate < now;
  };

  // Handle status change
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  // Handle task assignment
  const handleAssign = () => {
    if (assigneeId) {
      assignTaskMutation.mutate(assigneeId);
    }
  };

  // Handle task self-assignment
  const handleSelfAssign = () => {
    if (user?.id) {
      assignTaskMutation.mutate(user.id);
    }
  };

  // Handle task deletion
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTaskMutation.mutate();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Task header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <div className="mt-2 flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                  ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    task.status === 'inProgress' ? 'bg-blue-100 text-blue-800' : 
                    'bg-green-100 text-green-800'}`}
                >
                  {task.status === 'inProgress' ? 'In Progress' : task.status}
                </span>
                
                {isOverdue() && (
                  <span className="ml-2 text-sm text-red-600 font-medium">
                    Overdue
                  </span>
                )}
                
                <span className="mx-2 text-gray-300">•</span>
                
                <span className="text-sm text-gray-500">
                  Created by {task.creator.username} on {formattedCreatedDate}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {(isCreator || currentUnit?.id === task.unitId) && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
                >
                  Delete
                </button>
              )}
              
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
        
        {/* Task details */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <div className="bg-gray-50 p-4 rounded-md min-h-[100px]">
              {task.description ? (
                <p className="text-gray-700 whitespace-pre-line">{task.description}</p>
              ) : (
                <p className="text-gray-400 italic">No description provided</p>
              )}
            </div>
            
            {/* Media evidence */}
            {task.completionMedia && task.completionMedia.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Completion Evidence</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {task.completionMedia.map((media: any) => (
                    <div key={media.id} className="bg-gray-50 p-2 rounded-md">
                      {media.type === 'image' ? (
                        <a href={media.url} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={media.url} 
                            alt="Completion evidence" 
                            className="w-full h-36 object-cover rounded-md hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : (
                        <a href={media.url} target="_blank" rel="noopener noreferrer" className="block relative">
                          <div className="w-full h-36 bg-gray-200 flex items-center justify-center rounded-md hover:bg-gray-300 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="mt-1 text-center text-sm text-blue-600">View Video</div>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Task Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={!isAssignee && !isCreator}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="pending">To Do</option>
                      <option value="inProgress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                  <div className="mt-1">
                    {task.assignee ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                            {task.assignee.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="ml-2 text-gray-700">{task.assignee.username}</span>
                        </div>
                        {(isCreator || user?.id === currentUnit?.id) && (
                          <button
                            onClick={() => assignTaskMutation.mutate('')}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Unassign
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-500 mb-2">No one is assigned to this task</div>
                        
                        {(isCreator || user?.id === currentUnit?.id) && (
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">Select a member</option>
                                {unitMembers?.map((member: any) => (
                                  <option key={member.user.id} value={member.user.id}>
                                    {member.user.username}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={handleAssign}
                                disabled={!assigneeId}
                                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                              >
                                Assign
                              </button>
                            </div>
                            
                            <button
                              onClick={handleSelfAssign}
                              className="w-full px-3 py-1 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50"
                            >
                              Assign to myself
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                  <p className={`mt-1 ${isOverdue() ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                    {formattedDueDate}
                  </p>
                </div>
                
                {task.status !== 'completed' && isAssignee && (
                  <div className="mt-6">
                    <Link
                      to={`/tasks/${task.id}/complete`}
                      className="w-full block text-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Mark as Completed
                    </Link>
                    <p className="mt-1 text-xs text-gray-500 text-center">
                      You'll need to provide photo/video evidence
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;