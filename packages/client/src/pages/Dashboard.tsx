import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import unitService from '../services/unitService';
import InvitationList from '../components/unit/InvitationList';

const Dashboard: React.FC = () => {
  // Fetch user's units for quick access
  const { data: units, isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: unitService.getUserUnits
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to HomeTeam!</h2>
            <p className="text-gray-700 mb-4">
              Manage your household tasks and coordinate with family members or roommates.
            </p>
            <Link 
              to="/units" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Manage Your Households
            </Link>
          </div>
          
          {/* Quick access to units */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Households</h2>
            {isLoading ? (
              <p>Loading...</p>
            ) : units && units.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {units.slice(0, 4).map((unit) => (
                  <Link 
                    key={unit.id}
                    to={`/units/${unit.id}`}
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <h3 className="font-medium mb-1">{unit.name}</h3>
                    <p className="text-sm text-gray-600">
                      {unit._count?.members || 0} members • {unit._count?.tasks || 0} tasks
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-3">You don't have any households yet.</p>
                <Link 
                  to="/units" 
                  className="text-blue-600 hover:underline"
                >
                  Create your first household
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Invitations</h2>
            <InvitationList />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <p className="text-gray-600">
              Your recent activities will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;