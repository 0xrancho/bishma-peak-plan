import { useState, useEffect } from 'react';
import { Calendar, Clock, Mountain, CheckCircle, RefreshCw } from 'lucide-react';
import { TaskStateManager } from '@/services/TaskStateManager';
import { TaskState } from '@/types/TaskState';
import { AirtableService, AirtableTask } from '@/services/AirtableService';

interface DashboardTask {
  id: string;
  description: string;
  rice_score: number;
  status: string;
  effort: number;
  deadline?: string;
}

const DailyBriefing = () => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasksFromAirtable = async () => {
    console.log('🔄 loadTasksFromAirtable called');
    setIsRefreshing(true);
    setError(null);

    try {
      // Get API credentials from environment variables or localStorage
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY || localStorage.getItem('airtable_api_key');
      const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID || localStorage.getItem('airtable_base_id');

      console.log('🔑 Credentials check:', {
        hasApiKey: !!apiKey,
        hasBaseId: !!baseId,
        apiKeyLength: apiKey?.length,
        baseId: baseId,
        fromEnv: !!import.meta.env.VITE_AIRTABLE_API_KEY
      });

      if (!apiKey || !baseId) {
        const errorMsg = 'Airtable credentials not configured. Please configure in settings or .env file.';
        console.error('❌', errorMsg);
        setError(errorMsg);
        setIsRefreshing(false);
        return;
      }

      // Fetch all tasks (not filtered by session - get ALL tasks)
      const url = `https://api.airtable.com/v0/${baseId}/tblgA4jVOsYj0h76k`;
      console.log('📡 Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Airtable error response:', errorText);
        throw new Error(`Failed to fetch tasks: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Fetched from Airtable:', data.records?.length || 0, 'records');
      console.log('📋 Raw records:', data.records?.slice(0, 2));

      // Convert Airtable records to dashboard tasks
      const airtableTasks: DashboardTask[] = data.records
        .map((record: any) => {
          const task = {
            id: record.id,
            description: record.fields.Name || record.fields.description || 'Untitled',
            rice_score: record.fields.rice_score || 0,
            status: record.fields.status || 'pending',
            effort: record.fields.effort || 1,
            deadline: record.fields.due_date
          };
          console.log('📝 Mapped task:', task);
          return task;
        })
        .filter((t: DashboardTask) => {
          const isPending = t.status === 'pending';
          console.log(`🔍 Task "${t.description.substring(0, 30)}" - status: ${t.status}, isPending: ${isPending}`);
          return isPending;
        })
        .sort((a: DashboardTask, b: DashboardTask) => b.rice_score - a.rice_score);

      console.log('✅ Filtered pending tasks:', airtableTasks.length);
      console.log('📊 Top 5:', airtableTasks.slice(0, 5).map(t => ({
        desc: t.description.substring(0, 40),
        score: t.rice_score,
        status: t.status
      })));

      setTasks(airtableTasks);
      console.log('💾 Tasks state updated');

    } catch (err) {
      console.error('❌ Error loading tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleRefresh = () => {
    loadTasksFromAirtable();
  };

  useEffect(() => {
    // Initial load from Airtable
    loadTasksFromAirtable();

    // Listen for custom event from chat when tasks are updated
    const handleTaskUpdate = () => {
      console.log('📡 Detected task update, refreshing from Airtable');
      loadTasksFromAirtable();
    };

    window.addEventListener('tasks-updated', handleTaskUpdate);

    return () => {
      window.removeEventListener('tasks-updated', handleTaskUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tasks are already filtered and sorted from Airtable
  const pendingTasksWithScores = tasks;

  return (
    <div className="terminal-screen bg-background p-6 font-mono">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="ascii-art sherpa-text flex-1">
{`
=========================================
       BISHMA DAILY SYSTEMS CHECK
=========================================
`}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-4 p-2 rounded border border-terminal-border hover:bg-terminal-border/20 transition-colors disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-5 h-5 sherpa-text ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
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
                <div>Pending Tasks: <span className="sherpa-text">{tasks.length}</span></div>
                <div>High Priority (&gt;50): <span className="summit-red">{tasks.filter(t => t.rice_score > 50).length}</span></div>
                <div>Medium Priority (20-50): <span className="alpine-cyan">{tasks.filter(t => t.rice_score >= 20 && t.rice_score <= 50).length}</span></div>
                <div>Low Priority (&lt;20): <span className="basecamp-green">{tasks.filter(t => t.rice_score < 20).length}</span></div>
              </div>
            </div>
          </div>

          <div className="my-6">
            <div className="sherpa-text mb-3">PRIORITY PEAKS DETECTED:</div>
            <div className="space-y-2 font-mono text-xs">
              {pendingTasksWithScores.length > 0 ? (
                pendingTasksWithScores.slice(0, 5).map((task, index) => {
                  const priority = task.rice_score > 50 ? 'CRITICAL' :
                    task.rice_score > 20 ? 'HIGH' : 'NORMAL';
                  const colorClass =
                    priority === 'CRITICAL' ? 'summit-red' :
                    priority === 'HIGH' ? 'alpine-cyan' : 'basecamp-green';

                  // Format due date if available
                  const dueDateStr = task.deadline ?
                    `DUE: ${new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` :
                    'NO DUE DATE';

                  return (
                    <div key={task.id} className="flex items-center justify-between">
                      <span className="truncate flex-1 mr-4">
                        {index + 1}. <span className={colorClass}>[{priority}]</span> {task.description}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-4">
                        <span>RICE: {task.rice_score.toFixed(1)}</span>
                        <span className="terminal-amber">{dueDateStr}</span>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-muted-foreground">
                  {error ? `Error: ${error}` : 'No pending tasks found. Use chat to add tasks.'}
                </div>
              )}
            </div>
          </div>

          <div className="my-6">
            <div className="sherpa-text mb-3">SUGGESTED ROUTE:</div>
            <div className="space-y-1 font-mono text-xs">
              {pendingTasksWithScores.length > 0 ? (
                pendingTasksWithScores.slice(0, 3).map((task, index) => {
                  const startTime = 9 + index * 2; // Simple time allocation
                  const endTime = startTime + task.effort;
                  const priority = task.rice_score > 50 ? 'summit-red' :
                    task.rice_score > 20 ? 'alpine-cyan' : 'basecamp-green';

                  const progressBars = '█'.repeat(Math.min(12, Math.round(task.effort * 2))) +
                                      '░'.repeat(Math.max(0, 16 - Math.min(12, Math.round(task.effort * 2))));

                  return (
                    <div key={task.id} className="flex items-center justify-between">
                      <span className="truncate flex-1 mr-4">
                        {`${startTime.toString().padStart(2, '0')}:00-${endTime.toString().padStart(2, '0')}:00`}{' '}
                        <span className={priority}>{progressBars}</span>{' '}
                        {task.description.substring(0, 20).toUpperCase().replace(/\s/g, '_')}
                      </span>
                      <span className="text-muted-foreground">
                        {task.effort}h effort
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-muted-foreground">No scheduled tasks yet. Add tasks in chat to see your route.</div>
              )}
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