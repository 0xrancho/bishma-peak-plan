interface TaskCardProps {
  title: string;
  priority: 'SUMMIT' | 'ALPINE' | 'BASECAMP';
  progress: number;
  altitude: string;
  eta: string;
  status: 'BLOCKED' | 'IN_PROGRESS' | 'SUMMITED' | 'QUEUED';
}

const TaskCard = ({ title, priority, progress, altitude, eta, status }: TaskCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'SUMMIT': return 'priority-summit';
      case 'ALPINE': return 'priority-alpine';
      case 'BASECAMP': return 'priority-basecamp';
      default: return 'sherpa-text';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BLOCKED': return 'summit-red';
      case 'IN_PROGRESS': return 'sherpa-yellow';
      case 'SUMMITED': return 'basecamp-green';
      case 'QUEUED': return 'muted-foreground';
      default: return 'sherpa-text';
    }
  };

  const renderProgressBar = (progress: number) => {
    const filled = Math.floor(progress / 20);
    const empty = 5 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  return (
    <div className="task-card font-mono text-sm">
      <div className="border border-terminal-border bg-surface p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div className="sherpa-text font-medium">{title.toUpperCase().replace(/ /g, '_')}</div>
            <div className={`text-xs px-2 py-1 border rounded ${getStatusColor(status)}`}>
              [{status}]
            </div>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority:</span>
              <span className={getPriorityColor(priority)}>
                {priority} [{renderProgressBar(progress)}] {progress}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Altitude:</span>
              <span className="sherpa-text">{altitude}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">ETA:</span>
              <span className="sherpa-text">{eta}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;