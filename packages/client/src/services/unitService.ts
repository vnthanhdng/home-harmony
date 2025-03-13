import apiClient from './api';
import { API_URL } from '../config';

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
    const response = await apiClient.get('/units');
    console.log('Token being used in request:', localStorage.getItem('token'));
    console.log('API Response:', response); // Check the full response structure
    console.log('Data property:', response.data); // Check data property
    console.log('Data.data property:', response.data.data); // Check nested data
    return response.data;
  },

  // Get unit details including members
  getUnitDetails: async (unitId: string): Promise<UnitDetails> => {
    const response = await apiClient.get(`/units/${unitId}`);
    return response.data;
  },

  // Create a new unit
  createUnit: async (name: string): Promise<Unit> => {
    const response = await apiClient.post('/units', { name });
    return response.data;
  },

  // Update unit
  updateUnit: async (unitId: string, name: string): Promise<Unit> => {
    const response = await apiClient.put(`/units/${unitId}`, { name });
    return response.data;
  },

  // Delete unit
  deleteUnit: async (unitId: string): Promise<void> => {
    await apiClient.delete(`/units/${unitId}`);
  },

  // Invite user to unit
  inviteUser: async (
    unitId: string,
    email: string,
    role = 'member'
  ): Promise<UnitMember> => {
    const response = await apiClient.post(
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
    const response = await apiClient.put(
      `/units/${unitId}/members/${memberId}`,
      { role }
    );
    return response.data;
  },

  // Remove member
  removeMember: async (unitId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/units/${unitId}/members/${memberId}`);
  },

  // Get invitations
  getInvitations: async (): Promise<UnitInvitation[]> => {
    const response = await apiClient.get('/invitations');
    return response.data;
  },

  // Accept invitation
  acceptInvitation: async (invitationId: string): Promise<UnitMember> => {
    const response = await apiClient.put(
      `/invitations/${invitationId}`,
      { accept: true }
    );
    return response.data;
  },

  // Reject invitation
  rejectInvitation: async (invitationId: string): Promise<void> => {
    await apiClient.put(
      `/invitations/${invitationId}`,
      { accept: false }
    );
  },
};

export default unitService;