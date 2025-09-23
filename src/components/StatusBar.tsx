import { useState, useEffect } from 'react';

const StatusBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      timeZoneName: 'short'
    });
  };

  return (
    <div className="bg-surface border-b border-terminal-border px-4 py-2 font-mono text-sm sherpa-text flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <span>[BISHMA OS]</span>
        <span>|</span>
        <span>Altitude: 6,012m</span>
        <span>|</span>
        <span>Tasks: 3/7</span>
        <span>|</span>
        <span>Weather: Clear</span>
      </div>
      <div className="flex items-center space-x-2">
        <span>{formatTime(currentTime)}</span>
        <div className="w-2 h-2 bg-basecamp-green rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default StatusBar;