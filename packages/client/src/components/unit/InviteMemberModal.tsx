import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import unitService from '../../services/unitService';

// Define form validation schema
const inviteMemberSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address'),
  role: z.enum(['member', 'admin']).default('member')
});

type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId: string;
  onSuccess: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ 
  isOpen, 
  onClose,
  unitId,
  onSuccess
}) => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      role: 'member'
    }
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: (data: InviteMemberFormValues) => 
      unitService.inviteUser(unitId, data.email, data.role),
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
          <h2 className="text-xl font-bold">Invite Member</h2>
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

        <form onSubmit={handleSubmit((data) => inviteMemberMutation.mutate(data))}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              {...register('role')}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
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
              disabled={inviteMemberMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {inviteMemberMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>

          {inviteMemberMutation.isError && (
            <p className="mt-3 text-sm text-red-600">
              {inviteMemberMutation.error instanceof Error 
                ? inviteMemberMutation.error.message 
                : 'An error occurred while sending the invitation.'}
            </p>
          )}

          {inviteMemberMutation.isSuccess && (
            <p className="mt-3 text-sm text-green-600">
              Invitation sent successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;