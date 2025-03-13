import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import unitService, { Unit } from '../../services/unitService';
import CreateUnitModal from './CreateUnitModal';

const UnitList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch units data
  const { data: units, isLoading, error } = useQuery({
    queryKey: ['units'],
    queryFn: unitService.getUserUnits
  });

  // Delete unit mutation
  const deleteUnitMutation = useMutation({
    mutationFn: unitService.deleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    }
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  
  if (error) return (
    <div className="text-center py-8 text-red-600">
      Error loading units. Please try again.
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Households</h1>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Create New Household
        </button>
      </div>

      {units && units.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">You don't have any households yet.</p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Create Your First Household
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units?.map((unit: Unit) => (
            <div key={unit.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <h2 className="text-xl font-semibold mb-2">{unit.name}</h2>
              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>{unit._count?.members || 0} members</span>
                <span>{unit._count?.tasks || 0} tasks</span>
              </div>
              <div className="flex justify-between mt-4">
                <Link 
                  to={`/units/${unit.id}`}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 transition"
                >
                  View Details
                </Link>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this household?')) {
                      deleteUnitMutation.mutate(unit.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-800 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Unit Modal */}
      <CreateUnitModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['units'] });
          setIsCreateModalOpen(false);
        }} 
      />
    </div>
  );
};

export default UnitList;