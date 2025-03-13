// packages/client/src/components/auth/AuthTest.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

const AuthTest: React.FC = () => {
  const [publicData, setPublicData] = useState<any>(null);
  const [protectedData, setProtectedData] = useState<any>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Test public endpoint
  const testPublicEndpoint = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/test/public`);
      setPublicData(response.data);
    } catch (err) {
      console.error('Error testing public endpoint:', err);
      setError(err.message || 'Error testing public endpoint');
    } finally {
      setLoading(false);
    }
  };

  // Test protected endpoint
  const testProtectedEndpoint = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/test/protected`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProtectedData(response.data);
    } catch (err) {
      console.error('Error testing protected endpoint:', err);
      setError(err.message || 'Error testing protected endpoint');
    } finally {
      setLoading(false);
    }
  };

  // Test auth debug endpoint
  const testAuthDebug = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/test/auth-debug`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setDebugData(response.data);
    } catch (err) {
      console.error('Error testing auth debug:', err);
      setError(err.message || 'Error testing auth debug');
    } finally {
      setLoading(false);
    }
  };

  // Test login function
  const testLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/auth/test-login`);
      const { token, user } = response.data;
      
      // Save token to state and localStorage
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('username', user.username);
      
      alert('Test login successful! Token saved to localStorage.');
    } catch (err) {
      console.error('Error in test login:', err);
      setError(err.message || 'Error in test login');
    } finally {
      setLoading(false);
    }
  };

  // Save token to localStorage
  const saveToken = () => {
    localStorage.setItem('token', token);
    alert('Token saved to localStorage');
  };

  // Use the stored token 
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">JWT Token</h2>
        <div className="flex mb-2">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="flex-grow border p-2 rounded-l"
            placeholder="Enter JWT token"
          />
          <button
            onClick={saveToken}
            className="bg-blue-500 text-white p-2 rounded-r"
          >
            Save
          </button>
        </div>
        <button
          onClick={testLogin}
          className="w-full bg-green-600 text-white p-2 rounded mt-2"
          disabled={loading}
        >
          Get Test Token (No Login Required)
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Current token in localStorage: {localStorage.getItem('token') ? 'Token exists (hover to see)' : 'None'}
          {localStorage.getItem('token') && (
            <span className="tooltip" title={localStorage.getItem('token')}>
              ℹ️
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Public Endpoint Test</h2>
          <button
            onClick={testPublicEndpoint}
            disabled={loading}
            className="mb-2 bg-green-500 text-white p-2 rounded w-full"
          >
            Test Public Endpoint
          </button>
          {publicData && (
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(publicData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Protected Endpoint Test</h2>
          <button
            onClick={testProtectedEndpoint}
            disabled={loading || !token}
            className="mb-2 bg-yellow-500 text-white p-2 rounded w-full"
          >
            Test Protected Endpoint
          </button>
          {protectedData && (
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(protectedData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Auth Debug</h2>
          <button
            onClick={testAuthDebug}
            disabled={loading}
            className="mb-2 bg-blue-500 text-white p-2 rounded w-full"
          >
            Test Auth Headers
          </button>
          {debugData && (
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthTest;