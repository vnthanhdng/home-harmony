import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useUnitContext } from '../../contexts/UnitContext';

// Validation schema
const createTaskSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

const CreateTaskForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { currentUnit } = useUnitContext();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      assigneeId: '',
    }
  });

  // Fetch unit members for assignee dropdown
  const { data: unitMembers } = useQuery({
    queryKey: ['unitMembers', currentUnit?.id],
    queryFn: async () => {
      if (!currentUnit?.id) return [];
      const response = await axios.get(`/api/units/${currentUnit.id}/members`);
      return response.data;
    },
    enabled: !!currentUnit?.id,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskFormData) => {
      const response = await axios.post('/api/tasks', {
        ...data,
        unitId: currentUnit?.id,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch tasks query to show the new task
      queryClient.invalidateQueries({ queryKey: ['tasks', currentUnit?.id] });
      reset();
      if (onSuccess) onSuccess();
    },
  });

  const onSubmit = (data: CreateTaskFormData) => {
    createTaskMutation.mutate(data);
  };

  if (!currentUnit) {
    return <div className="text-center p-4">Please select a household first</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Task Title*
          </label>
          <input
            id="title"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="What needs to be done?"
            {...register('title')}
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Add details about this task..."
            {...register('description')}
          />
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            Due Date (Optional)
          </label>
          <input
            id="dueDate"
            type="datetime-local"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            {...register('dueDate')}
          />
        </div>

        <div>
          <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">
            Assign To (Optional)
          </label>
          <select
            id="assigneeId"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            {...register('assigneeId')}
          >
            <option value="">-- Select a person --</option>
            {unitMembers?.map((member: any) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.username}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
        
        {createTaskMutation.isError && (
          <div className="p-2 text-red-500 text-sm">
            Error creating task. Please try again.
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateTaskForm;