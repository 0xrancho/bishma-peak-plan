import { useState, useEffect } from 'react';

interface BootSequenceProps {
  onComplete: () => void;
}

const BootSequence = ({ onComplete }: BootSequenceProps) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  const bootLines = [
    "BISHMA OS v2.1.0",
    "Initializing priority engine...",
    "Loading mountain protocols...",
    "Checking weather conditions... OK",
    "Establishing basecamp connection... OK",
    "Calibrating altitude sensors... OK",
    "Loading task queue... 7 items found",
    "",
    "> Hello. Let's see what needs doing.",
    ""
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentLine < bootLines.length) {
        setCurrentLine(prev => prev + 1);
      } else {
        setShowCursor(false);
        setTimeout(onComplete, 1000);
      }
    }, currentLine === 0 ? 500 : currentLine === bootLines.length - 2 ? 1500 : 300);

    return () => clearTimeout(timer);
  }, [currentLine, onComplete, bootLines.length]);

  return (
    <div className="terminal-screen min-h-screen bg-background p-8 font-mono">
      <div className="max-w-4xl mx-auto">
        <div className="ascii-art mb-8 sherpa-text">
{`
    /\\        BISHMA PRIORITY SHERPA
   /  \\       Your Mountain Guide
  /____\\      for Daily Chaos
 /      \\     
/_______\\
`}
        </div>
        
        <div className="space-y-2">
          {bootLines.slice(0, currentLine).map((line, index) => (
            <div key={index} className="sherpa-text terminal-glow">
              {line.startsWith('>') ? (
                <span className="status-ready">{line}</span>
              ) : (
                line
              )}
            </div>
          ))}
          {showCursor && currentLine < bootLines.length && (
            <div className="sherpa-text terminal-cursor"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BootSequence;