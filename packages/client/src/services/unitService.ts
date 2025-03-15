import apiClient from './api';

// Types
export interface Unit {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    tasks: number;
  };
}

export interface UnitMember {
  id: string;
  role: string;
  status: string;
  userId: string;
  unitId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface UnitDetails extends Unit {
  members: UnitMember[];
  tasks: any[];
}

export interface UnitInvitation extends UnitMember {
  unit: Unit;
}

// API functions
const unitService = {
  // Get all units for current user
  getUserUnits: async (): Promise<Unit[]> => {
    // Use apiClient instead of direct axios
    const response = await apiClient.get<{ data: Unit[] }>('/units');
    return response.data || [];
  },

  // Get unit details including members
  getUnitDetails: async (unitId: string): Promise<UnitDetails> => {
    const response = await apiClient.get<{ data: UnitDetails }>(`/units/${unitId}`);
    return response.data;
  },

  // Create a new unit
  createUnit: async (name: string): Promise<Unit> => {
    const response = await apiClient.post<{ data: Unit, message: string }>('/units', { name });
    return response.data;
  },

  // Update unit
  updateUnit: async (unitId: string, name: string): Promise<Unit> => {
    const response = await apiClient.put<{ data: Unit, message: string }>(`/units/${unitId}`, { name });
    return response.data;
  },

  // Delete unit
  deleteUnit: async (unitId: string): Promise<void> => {
    await apiClient.delete<{ message: string }>(`/units/${unitId}`);
  },

  // Invite user to unit
  inviteUser: async (
    unitId: string,
    email: string,
    role = 'member'
  ): Promise<UnitMember> => {
    const response = await apiClient.post<{ data: UnitMember, message: string }>(
      `/units/${unitId}/members`, 
      { email, role }
    );
    return response.data;
  },

  // Update member role
  updateMemberRole: async (
    unitId: string,
    memberId: string,
    role: string
  ): Promise<UnitMember> => {
    const response = await apiClient.put<{ data: UnitMember, message: string }>(
      `/units/${unitId}/members/${memberId}`,
      { role }
    );
    return response.data;
  },

  // Remove member
  removeMember: async (unitId: string, memberId: string): Promise<void> => {
    await apiClient.delete<{ message: string }>(`/units/${unitId}/members/${memberId}`);
  },

  // Get invitations
  getInvitations: async (): Promise<UnitInvitation[]> => {
    const response = await apiClient.get<{ data: UnitInvitation[] }>('/invitations');
    return response.data || [];
  },

  // Accept invitation
  acceptInvitation: async (invitationId: string): Promise<UnitMember> => {
    const response = await apiClient.put<{ data: UnitMember, message: string }>(
      `/invitations/${invitationId}`,
      { accept: true }
    );
    return response.data;
  },

  // Reject invitation
  rejectInvitation: async (invitationId: string): Promise<void> => {
    await apiClient.put<{ message: string }>(
      `/invitations/${invitationId}`,
      { accept: false }
    );
  },
};

export default unitService;