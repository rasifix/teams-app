import { useEffect, useState } from 'react';

interface ApiStatusProps {
  className?: string;
}

export function ApiStatus({ className = '' }: ApiStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkApiHealth = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/health', {
        method: 'GET',
        timeout: 5000, // 5 second timeout
      } as RequestInit);
      setIsOnline(response.ok);
    } catch (error) {
      console.warn('API health check failed:', error);
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
    
    // Check API health every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isOnline && !isChecking) {
    return null; // Don't show anything when API is working
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      {isChecking ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg text-sm flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-600 rounded-full border-t-transparent"></div>
          <span>Checking connection...</span>
        </div>
      ) : (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center space-x-2">
          <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          <span>Server disconnected</span>
          <button
            onClick={checkApiHealth}
            className="ml-2 text-red-800 hover:text-red-900 underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}