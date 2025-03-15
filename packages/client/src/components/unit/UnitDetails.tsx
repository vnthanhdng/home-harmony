import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import unitService, { UnitMember } from "../../services/unitService";
import InviteMemberModal from "./InviteMemberModal";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const UnitDetails: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [unitName, setUnitName] = useState("");

  console.log("Current invite modal state:", isInviteModalOpen);


  // Fetch unit details
  const {
    data: unit,
    isLoading,
    error,
  } = useQuery<Unit>({
    queryKey: ["unitDetails", unitId],
    queryFn: () =>
      unitId
        ? unitService.getUnitDetails(unitId)
        : Promise.reject("No unit ID"),
    onSuccess: (data) => {
      setUnitName(data.name);
    },
  });



  // Update unit name mutation
  const updateUnitMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      unitService.updateUnit(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unitDetails", unitId] });
      setEditingName(false);
    },
  });

  // Delete unit mutation
  const deleteUnitMutation = useMutation({
    mutationFn: unitService.deleteUnit,
    onSuccess: () => {
      navigate("/units");
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ unitId, memberId }: { unitId: string; memberId: string }) =>
      unitService.removeMember(unitId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unitDetails", unitId] });
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({
      unitId,
      memberId,
      role,
    }: {
      unitId: string;
      memberId: string;
      role: string;
    }) => unitService.updateMemberRole(unitId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unitDetails", unitId] });
    },
  });

  // Check if current user is admin
//   const isAdmin = true;
//   unit?.members.some(
//     (member) => member.user?.id === currentUserId && member.role === "admin"
//   );
const { user, isAdmin } = useAuth();
const userIsAdmin = unit ? isAdmin(unitId!, unit) : false;


  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  if (error || !unit)
    return (
      <div className="text-center py-8 text-red-600">
        Error loading unit details. Please try again.
      </div>
    );

  const handleSaveUnitName = () => {
    if (unitId && unitName.trim()) {
      updateUnitMutation.mutate({ id: unitId, name: unitName });
    }
  };

  const handleDeleteUnit = () => {
    if (
      unitId &&
      window.confirm(
        "Are you sure you want to delete this household? This action cannot be undone."
      )
    ) {
      deleteUnitMutation.mutate(unitId);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (
      unitId &&
      window.confirm("Are you sure you want to remove this member?")
    ) {
      removeMemberMutation.mutate({ unitId, memberId });
    }
  };

  const handleUpdateRole = (memberId: string, newRole: string) => {
    if (unitId) {
      updateRoleMutation.mutate({ unitId, memberId, role: newRole });
    }
  };

  // Filter only active members
  const activeMembers = unit.members.filter(
    (member) => member.status === "active"
  );

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {editingName ? (
            <div className="flex items-center">
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="border rounded px-2 py-1 mr-2"
                autoFocus
              />
              <button
                onClick={handleSaveUnitName}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
                disabled={updateUnitMutation.isPending}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setUnitName(unit.name);
                }}
                className="ml-2 text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">
              {unit.name}
              {userIsAdmin && (
                <button
                  onClick={() => setEditingName(true)}
                  className="ml-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  ✏️ Edit
                </button>
              )}
            </h1>
          )}
          
          {userIsAdmin && (
            <div className="flex space-x-3">
              <button
                onClick={() => {console.log("Invite button clicked");
                    setIsInviteModalOpen(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Invite Member
              </button>
              <button
                onClick={handleDeleteUnit}
                className="text-red-600 hover:text-red-800 transition"
                disabled={deleteUnitMutation.isPending}
              >
                Delete Household
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Members ({activeMembers.length})
        </h2>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Joined
                </th>
                {userIsAdmin && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeMembers.map((member: UnitMember) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {member.user?.username.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.user?.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {userIsAdmin && member.user?.id !== user?.id ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(member.id, e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {member.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  {userIsAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {member.user?.id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={removeMemberMutation.isPending}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>
        {unit.tasks.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {unit.tasks.map((task) => (
                <li key={task.id} className="px-4 py-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500">No tasks have been created yet.</p>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        unitId={unitId || ""}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["unitDetails", unitId] });
          setIsInviteModalOpen(false);
        }}
      />

     
    </div>
  );
};

export default UnitDetails;
