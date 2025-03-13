import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import unitService from '../../services/unitService';

// Define form validation schema
const createUnitSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters')
});

type CreateUnitFormValues = z.infer<typeof createUnitSchema>;

interface CreateUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUnitModal: React.FC<CreateUnitModalProps> = ({ 
  isOpen, 
  onClose,
  onSuccess
}) => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset
  } = useForm<CreateUnitFormValues>({
    resolver: zodResolver(createUnitSchema)
  });

  // Create unit mutation
  const createUnitMutation = useMutation({
    mutationFn: (data: CreateUnitFormValues) => unitService.createUnit(data.name),
    onSuccess: () => {
      reset();
      onSuccess();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Household</h2>
          <button 
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => createUnitMutation.mutate(data))}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Household Name
            </label>
            <input
              id="name"
              type="text"
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter household name"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUnitMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {createUnitMutation.isPending ? 'Creating...' : 'Create Household'}
            </button>
          </div>

          {createUnitMutation.isError && (
            <p className="mt-3 text-sm text-red-600">
              {createUnitMutation.error instanceof Error 
                ? createUnitMutation.error.message 
                : 'An error occurred while creating the household.'}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateUnitModal;