// packages/client/src/contexts/UnitContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

// Define Unit type
export interface Unit {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Context type definition
interface UnitContextType {
  units: Unit[];
  isLoading: boolean;
  error: unknown;
  currentUnit: Unit | null;
  setCurrentUnit: (unit: Unit | null) => void;
  refreshUnits: () => void;
}

// Create context with default values
const UnitContext = createContext<UnitContextType>({
  units: [],
  isLoading: false,
  error: null,
  currentUnit: null,
  setCurrentUnit: () => {},
  refreshUnits: () => {},
});

// Custom hook to use the UnitContext
export const useUnitContext = () => useContext(UnitContext);

// Provider component
export const UnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);

  // Fetch user's units
  const {
    data: units = [],
    isLoading,
    error,
    refetch: refreshUnits,
  } = useQuery({
    queryKey: ['units', user?.id],
    queryFn: async () => {
      const response = await axios.get('/api/units/me');
      return response.data as Unit[];
    },
    enabled: !!isAuthenticated && !!user?.id,
  });

  // Set the first unit as current if none is selected
  useEffect(() => {
    if (units.length > 0 && !currentUnit) {
      setCurrentUnit(units[0]);
    }
    
    // Reset current unit if it's not in the list anymore
    if (units.length > 0 && currentUnit && !units.some(unit => unit.id === currentUnit.id)) {
      setCurrentUnit(units[0]);
    }
    
    // Reset current unit if there are no units
    if (units.length === 0 && currentUnit) {
      setCurrentUnit(null);
    }
  }, [units, currentUnit]);

  // Save current unit selection to local storage
  useEffect(() => {
    if (currentUnit) {
      localStorage.setItem('currentUnitId', currentUnit.id);
    } else {
      localStorage.removeItem('currentUnitId');
    }
  }, [currentUnit]);

  // Load saved unit selection from local storage on initial load
  useEffect(() => {
    if (units.length > 0 && !currentUnit) {
      const savedUnitId = localStorage.getItem('currentUnitId');
      if (savedUnitId) {
        const savedUnit = units.find(unit => unit.id === savedUnitId);
        if (savedUnit) {
          setCurrentUnit(savedUnit);
        }
      }
    }
  }, [units, currentUnit]);

  const value = {
    units,
    isLoading,
    error,
    currentUnit,
    setCurrentUnit,
    refreshUnits,
  };

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
};