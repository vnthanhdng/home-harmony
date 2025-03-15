import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import unitService from '../services/unitService';
import taskService from '../services/taskService';
import InvitationList from '../components/unit/InvitationList';
import TaskList from '../components/tasks/TaskList';
import CreateTaskButton from '../components/tasks/CreateTaskButton';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  
  // Fetch user's units for quick access
  const { 
    data: units, 
    isLoading: unitsLoading 
  } = useQuery({
    queryKey: ['units'],
    queryFn: unitService.getUserUnits
  });

  // Fetch tasks for selected unit
  const {
    data: tasks,
    isLoading: tasksLoading,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['tasks', selectedUnit],
    queryFn: () => taskService.getUnitTasks(selectedUnit as string),
    enabled: !!selectedUnit,
  });

  // Auto-select first unit if none selected
  useEffect(() => {
    if (!selectedUnit && units && units.length > 0) {
      setSelectedUnit(units[0].id);
    }
  }, [units, selectedUnit]);

  // Handle unit change
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUnit(e.target.value);
  };

  // Get task stats
  const getTaskStats = () => {
    if (!tasks) return { total: 0, completed: 0, inProgress: 0, pending: 0 };
    
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const inProgress = tasks.filter(task => task.status === 'inProgress').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    
    return { total, completed, inProgress, pending };
  };

  const taskStats = getTaskStats();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Task Management Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tasks</h2>
              <div className="flex items-center space-x-2">
                {units && units.length > 0 && (
                  <select
                    value={selectedUnit || ''}
                    onChange={handleUnitChange}
                    className="border rounded-md px-3 py-1.5 text-sm"
                  >
                    <option value="" disabled>Select household</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                )}
                
                {selectedUnit && (
                  <CreateTaskButton 
                    unitId={selectedUnit} 
                    onTaskCreated={() => refetchTasks()} 
                  />
                )}
              </div>
            </div>
            
            {!selectedUnit ? (
              <div className="text-center py-10 text-gray-500">
                {unitsLoading ? "Loading households..." : "Select a household to manage tasks"}
              </div>
            ) : tasksLoading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <TaskList 
                tasks={tasks || []} 
                onStatusChange={() => refetchTasks()} 
              />
            )}
          </div>
          
          {/* Quick access to units */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Households</h2>
            {unitsLoading ? (
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
                  to="/units/create" 
                  className="text-blue-600 hover:underline"
                >
                  Create your first household
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          {/* Task Statistics */}
          {selectedUnit && tasks && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Task Statistics</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Completion Rate</span>
                    <span className="font-medium">
                      {taskStats.total > 0 
                        ? Math.round((taskStats.completed / taskStats.total) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${taskStats.total > 0 
                          ? (taskStats.completed / taskStats.total) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-blue-600 text-xl font-semibold">{taskStats.pending}</div>
                    <div className="text-xs text-gray-600">To Do</div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <div className="text-yellow-600 text-xl font-semibold">{taskStats.inProgress}</div>
                    <div className="text-xs text-gray-600">In Progress</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-green-600 text-xl font-semibold">{taskStats.completed}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <button
                    onClick={() => navigate(`/units/${selectedUnit}/tasks`)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View All Tasks →
                  </button>
                </div>
              </div>
            </div>
          )}
        
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Invitations</h2>
            <InvitationList />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            {selectedUnit && tasks ? (
              <div className="space-y-3">
                {tasks.slice(0, 3).map(task => (
                  <div key={task.id} className="border-b pb-2 last:border-0">
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>
                        {task.status === 'completed' ? 'Completed' : 
                         task.status === 'inProgress' ? 'In Progress' : 'Pending'}
                      </span>
                      <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-gray-600 text-sm">No recent task activity.</p>
                )}
              </div>
            ) : (
              <p className="text-gray-600">
                Your recent activities will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;