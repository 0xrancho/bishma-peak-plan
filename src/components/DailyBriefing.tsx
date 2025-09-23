import { Calendar, Clock, Mountain, CheckCircle } from 'lucide-react';

const DailyBriefing = () => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  return (
    <div className="terminal-screen bg-background p-6 font-mono">
      <div className="max-w-4xl mx-auto">
        <div className="ascii-art sherpa-text mb-6">
{`
=========================================
       BISHMA DAILY SYSTEMS CHECK
=========================================
`}
        </div>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="sherpa-text mb-2">SYSTEM STATUS</div>
              <div className="space-y-1 text-muted-foreground">
                <div>Date: {dateString}</div>
                <div>Altitude Status: <span className="basecamp-green">OPERATIONAL</span></div>
                <div>Weather: <span className="sherpa-text">▅▅▃▃▁▁▃▃</span> (morning clouds)</div>
                <div>Energy Level: <span className="alpine-cyan">█████████░</span> 85%</div>
              </div>
            </div>

            <div>
              <div className="sherpa-text mb-2">QUEUE ANALYSIS</div>
              <div className="space-y-1 text-muted-foreground">
                <div>Total Tasks: <span className="sherpa-text">7</span></div>
                <div>Critical: <span className="summit-red">1</span></div>
                <div>High Priority: <span className="alpine-cyan">2</span></div>
                <div>Blocked: <span className="terminal-amber">1</span></div>
              </div>
            </div>
          </div>

          <div className="my-6">
            <div className="sherpa-text mb-3">PRIORITY PEAKS DETECTED:</div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span>1. <span className="summit-red">[CRITICAL]</span> Payment API</span>
                <span className="text-muted-foreground">8,611m</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. <span className="alpine-cyan">[HIGH]</span> Board prep</span>
                <span className="text-muted-foreground">6,102m</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. <span className="basecamp-green">[NORMAL]</span> Email Greg</span>
                <span className="text-muted-foreground">2,100m</span>
              </div>
            </div>
          </div>

          <div className="my-6">
            <div className="sherpa-text mb-3">SUGGESTED ROUTE:</div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span>09:00-11:30 <span className="summit-red">████████████░░░░</span> API_FIX</span>
                <span className="text-muted-foreground">Peak focus time</span>
              </div>
              <div className="flex items-center justify-between">
                <span>14:00-15:30 <span className="alpine-cyan">████████░░░░░░░░</span> BOARD_PREP</span>
                <span className="text-muted-foreground">Post-lunch clarity</span>
              </div>
              <div className="flex items-center justify-between">
                <span>15:45-16:00 <span className="basecamp-green">██░░░░░░░░░░░░░░</span> QUICK_WINS</span>
                <span className="text-muted-foreground">Energy maintenance</span>
              </div>
            </div>
          </div>

          <div className="border-t border-terminal-border pt-4 mt-6">
            <div className="sherpa-text text-center">
              Press <span className="keyword-pink">ENTER</span> to continue to basecamp...
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="ascii-art text-xs text-muted-foreground">
{`
=========================================
         Ready for expedition?
=========================================`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyBriefing;