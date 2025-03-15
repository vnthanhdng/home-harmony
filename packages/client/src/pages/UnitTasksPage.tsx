// src/pages/UnitTasksPage.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import taskService from '../services/taskService';
import unitService from '../services/unitService';
import TaskList from '../components/tasks/TaskList';
import CreateTaskButton from '../components/tasks/CreateTaskButton';

const UnitTasksPage: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>();
  
  // Fetch unit details
  const { 
    data: unit, 
    isLoading: unitLoading 
  } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => unitService.getUnitDetails(unitId as string),
    enabled: !!unitId
  });
  
  // Fetch tasks for this unit
  const { 
    data: tasks, 
    isLoading: tasksLoading,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['tasks', unitId],
    queryFn: () => taskService.getUnitTasks(unitId as string),
    enabled: !!unitId
  });

  const isLoading = unitLoading || tasksLoading;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link 
              to={`/units/${unitId}`} 
              className="text-blue-600 hover:underline inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Unit
            </Link>
            <h1 className="text-2xl font-bold mt-2">
              {unitLoading ? 'Loading...' : unit?.name || 'Unit'} Tasks
            </h1>
          </div>
          
          {!isLoading && unitId && (
            <CreateTaskButton 
              unitId={unitId} 
              onTaskCreated={() => refetchTasks()}
            />
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="p-6">
            <TaskList 
              tasks={tasks} 
              unitId={unitId as string}
              onStatusChange={() => refetchTasks()}
              onTaskCreated={() => refetchTasks()}
              showCreateButton={false}
            />
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No tasks found for this household.</p>
            {unitId && (
              <CreateTaskButton 
                unitId={unitId} 
                onTaskCreated={() => refetchTasks()}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitTasksPage;