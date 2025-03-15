import React from 'react';

interface ErrorMessageProps {
  error: unknown;
  defaultMessage?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  defaultMessage = 'An error occurred. Please try again.' 
}) => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : defaultMessage;
    
  return (
    <div className="p-3 bg-red-100 text-red-700 rounded my-3">
      {errorMessage}
    </div>
  );
};

export default ErrorMessage;