import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useNetworkMode } from '../hooks/useNetworkMode';

export const ModeBanner: React.FC = () => {
  const { isTestnetMode, showBanner, bannerMessage, setShowBanner } = useNetworkMode();

  // Auto-hide the notification banner after 3 seconds
  useEffect(() => {
    if (showBanner) {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showBanner, setShowBanner]);

  if (!showBanner) return null;

  return (
    <>
      {/* Notification Banner */}
      {showBanner && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
          isTestnetMode ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
        }`}>
          <div className="flex items-center justify-between space-x-4">
            <span>{bannerMessage}</span>
            <button onClick={() => setShowBanner(false)} className="text-white hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};