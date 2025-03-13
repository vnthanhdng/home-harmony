import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import unitService, { UnitInvitation } from '../../services/unitService';

const InvitationList: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Fetch invitations
  const { data: invitations, isLoading, error } = useQuery({
    queryKey: ['invitations'],
    queryFn: unitService.getInvitations
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: unitService.acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    }
  });

  // Reject invitation mutation
  const rejectInvitationMutation = useMutation({
    mutationFn: unitService.rejectInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    }
  });

  if (isLoading) return <div className="text-center py-4">Loading invitations...</div>;
  
  if (error) return (
    <div className="text-center py-4 text-red-600">
      Error loading invitations. Please try again.
    </div>
  );

  if (!invitations || invitations.length === 0) {
    return (
      <div className="border rounded-lg p-4 text-center text-gray-500">
        You don't have any pending invitations.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <h2 className="bg-blue-50 px-4 py-2 font-medium border-b">
        Pending Invitations ({invitations.length})
      </h2>
      <ul className="divide-y divide-gray-200">
        {invitations.map((invitation: UnitInvitation) => (
          <li key={invitation.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{invitation.unit.name}</h3>
                <p className="text-sm text-gray-600">
                  Role: <span className="capitalize">{invitation.role}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Invited on {new Date(invitation.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => acceptInvitationMutation.mutate(invitation.id)}
                  disabled={acceptInvitationMutation.isPending}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                >
                  Accept
                </button>
                <button
                  onClick={() => rejectInvitationMutation.mutate(invitation.id)}
                  disabled={rejectInvitationMutation.isPending}
                  className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100 transition"
                >
                  Decline
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InvitationList;