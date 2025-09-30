import { TaskState } from '@/types/TaskState';

interface RICEProgressIndicatorProps {
  task: TaskState;
  missingParameters: string[];
}

const RICEProgressIndicator = ({ task, missingParameters }: RICEProgressIndicatorProps) => {
  const totalParams = 4;
  const completedParams = totalParams - missingParameters.length;
  const progress = (completedParams / totalParams) * 100;

  const parameterStatus = {
    reach: task.completeness.hasReach,
    impact: task.completeness.hasImpact,
    confidence: task.completeness.hasConfidence,
    effort: task.completeness.hasEffort
  };

  return (
    <div className="bg-surface border border-terminal-border rounded p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-mono text-sm sherpa-text truncate flex-1 mr-2">
          {task.description}
        </h4>
        <div className="text-xs font-mono text-muted-foreground">
          {completedParams}/{totalParams}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-background rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            progress === 100 ? 'bg-sherpa-green' : 'bg-yellow-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* RICE parameter chips */}
      <div className="flex gap-2 mb-2">
        {Object.entries(parameterStatus).map(([param, completed]) => (
          <div
            key={param}
            className={`px-2 py-1 rounded text-xs font-mono ${
              completed
                ? 'bg-sherpa-green/20 text-sherpa-green border border-sherpa-green/30'
                : 'bg-muted/20 text-muted-foreground border border-muted/30'
            }`}
          >
            {param.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Missing parameters hint */}
      {missingParameters.length > 0 && (
        <div className="text-xs font-mono text-muted-foreground">
          Missing: {missingParameters.join(', ')}
        </div>
      )}

      {/* RICE score display for complete tasks */}
      {task.completeness.isComplete && (
        <div className="mt-2 pt-2 border-t border-terminal-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">RICE Score:</span>
            <span className="text-sm font-mono sherpa-text">
              {task.parameters.reach && task.parameters.impact && task.parameters.confidence && task.parameters.effort
                ? Math.round(((task.parameters.reach * task.parameters.impact * task.parameters.confidence) / task.parameters.effort) * 100) / 100
                : 'Calculating...'
              }
            </span>
          </div>
          <div className="text-xs font-mono text-muted-foreground mt-1">
            R({task.parameters.reach}) × I({task.parameters.impact}) × C({task.parameters.confidence}) ÷ E({task.parameters.effort})
          </div>
        </div>
      )}

      {/* Sync status */}
      <div className="mt-2 flex items-center justify-between">
        <div className={`text-xs font-mono ${
          task.syncStatus === 'synced'
            ? 'text-sherpa-green'
            : task.syncStatus === 'partial'
            ? 'text-yellow-500'
            : 'text-muted-foreground'
        }`}>
          {task.syncStatus === 'synced' && '✓ Synced to Airtable'}
          {task.syncStatus === 'partial' && '⏳ Partial sync'}
          {task.syncStatus === 'pending' && '○ Not synced'}
        </div>

        {task.completeness.isComplete && task.syncStatus !== 'synced' && (
          <div className="text-xs font-mono sherpa-text">
            Ready for Airtable
          </div>
        )}
      </div>
    </div>
  );
};

export default RICEProgressIndicator;