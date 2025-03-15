import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnitContext } from '../../contexts/UnitContext';

const UnitSelector: React.FC = () => {
  const { units, currentUnit, setCurrentUnit } = useUnitContext();
  const navigate = useNavigate();
  
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unitId = e.target.value;
    
    if (unitId === 'create') {
      navigate('/units/create');
      return;
    }
    
    if (unitId === 'join') {
      navigate('/units/join');
      return;
    }
    
    const selectedUnit = units.find(unit => unit.id === unitId);
    if (selectedUnit) {
      setCurrentUnit(selectedUnit);
    }
  };

  return (
    <div className="flex space-x-2">
      <select
        value={currentUnit?.id || ''}
        onChange={handleUnitChange}
        className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="" disabled>Select a household</option>
        
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
        
        <option value="" disabled>---------------</option>
        <option value="create">+ Create New Household</option>
        <option value="join">+ Join Existing Household</option>
      </select>
      
      {currentUnit && (
        <button
          onClick={() => navigate(`/units/${currentUnit.id}`)}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          title="Household Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default UnitSelector;