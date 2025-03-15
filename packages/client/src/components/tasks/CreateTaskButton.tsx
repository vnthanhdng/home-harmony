import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import taskService, { CreateTaskData } from '../../services/taskService';
import unitService from '../../services/unitService';
import { toast } from 'react-toastify';

interface CreateTaskButtonProps {
  unitId: string;
  onTaskCreated?: () => void;
  compact?: boolean;
}

const CreateTaskButton: React.FC<CreateTaskButtonProps> = ({ 
  unitId, 
  onTaskCreated,
  compact = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateTaskData>({
    defaultValues: {
      title: '',
      description: '',
      unitId: unitId,
    }
  });
  
  // Fetch unit members for assignee dropdown
  const { data: unitDetails } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => unitService.getUnitDetails(unitId),
    enabled: !!unitId && isModalOpen,
  });
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskData) => taskService.createTask(data),
    onSuccess: (_data, _variables, _context) => {
      setIsModalOpen(false);
      reset();
      toast.success('Task created successfully');
      if (onTaskCreated) {
        onTaskCreated();
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create task');
    }
  });
  
  // Handle form submission
  const onSubmit = (data: CreateTaskData) => {
    createTaskMutation.mutate({
      ...data,
      unitId: unitId, // Ensure the correct unitId is set
    });
  };

  // Close modal and reset form
  const handleClose = () => {
    setIsModalOpen(false);
    reset();
  };
  
  return (
    <>
      {/* Create Task Button */}
      {compact ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          title="Create a new task"
        >
          + New Task
        </button>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition flex items-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Task
        </button>
      )}
      
      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Create New Task</h3>
                <button 
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="What needs to be done?"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    {...register('description')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Add more details about this task..."
                  />
                </div>
                
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                    Due Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    id="dueDate"
                    {...register('dueDate')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">
                    Assign To (Optional)
                  </label>
                  <select
                    id="assigneeId"
                    {...register('assigneeId')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">-- Select a person --</option>
                    {unitDetails?.members?.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.user?.username || 'Unknown user'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || createTaskMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {isSubmitting || createTaskMutation.isLoading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateTaskButton;