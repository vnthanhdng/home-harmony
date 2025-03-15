import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import UnitList from './components/unit/UnitList';
import UnitDetails from './components/unit/UnitDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TaskDetailPage from './pages//TaskDetailPage';
import TaskCompletionPage from './pages/TaskCompletionPage';
import UnitTasksPage from './pages/UnitTasksPage';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/units" element={<UnitList />} />
              <Route path="/units/:unitId" element={<UnitDetails />} />
              <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
<Route path="/tasks/:taskId/complete" element={<TaskCompletionPage />} />
<Route path="/units/:unitId/tasks" element={<UnitTasksPage />} />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;