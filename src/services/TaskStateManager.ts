import { TaskState, ConversationContext, RICEScore, TaskStatus } from '../types/TaskState';

export class TaskStateManager {
  private tasks: Map<string, TaskState>;
  private sessionId: string;
  private currentFocusTaskId: string | null = null;
  private taskQueue: string[] = [];

  constructor(sessionId?: string) {
    this.tasks = new Map();
    this.sessionId = sessionId || this.generateSessionId();
    this.loadFromLocalStorage();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToLocalStorage(): void {
    const context: ConversationContext = {
      tasks: this.tasks,
      sessionId: this.sessionId,
      lastActivity: new Date()
    };

    // Convert Map to Object for JSON serialization
    const serializable = {
      ...context,
      tasks: Object.fromEntries(this.tasks),
      currentFocusTaskId: this.currentFocusTaskId,
      taskQueue: this.taskQueue
    };

    localStorage.setItem('bishma_conversation_context', JSON.stringify(serializable));

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('tasks-updated', {
      detail: { taskCount: this.tasks.size }
    }));
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('bishma_conversation_context');
      if (stored) {
        const context = JSON.parse(stored);
        this.tasks = new Map(Object.entries(context.tasks));
        this.sessionId = context.sessionId || this.sessionId;
        this.currentFocusTaskId = context.currentFocusTaskId || null;
        this.taskQueue = context.taskQueue || [];
      }
    } catch (error) {
      console.warn('Failed to load conversation context from localStorage:', error);
    }
  }

  createTask(description: string): TaskState {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const task: TaskState = {
      id,
      description,
      parameters: {},
      completeness: {
        hasReach: false,
        hasImpact: false,
        hasConfidence: false,
        hasEffort: false,
        isComplete: false
      },
      metadata: {},
      conversationLog: [],
      lastUpdated: new Date(),
      syncStatus: 'pending',
      status: 'pending'
    };

    this.tasks.set(id, task);
    this.saveToLocalStorage();
    return task;
  }

  updateTaskParameters(taskId: string, updates: Partial<TaskState['parameters']>): TaskState | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    console.log('🔄 TaskStateManager.updateTaskParameters:', {
      taskId,
      currentParameters: task.parameters,
      updates,
      currentCompleteness: task.completeness
    });

    // Update parameters
    Object.assign(task.parameters, updates);

    // Update completeness flags
    task.completeness.hasReach = task.parameters.reach !== undefined;
    task.completeness.hasImpact = task.parameters.impact !== undefined;
    task.completeness.hasConfidence = task.parameters.confidence !== undefined;
    task.completeness.hasEffort = task.parameters.effort !== undefined;
    task.completeness.isComplete =
      task.completeness.hasReach &&
      task.completeness.hasImpact &&
      task.completeness.hasConfidence &&
      task.completeness.hasEffort;

    console.log('📊 After parameter update:', {
      taskId,
      parameters: task.parameters,
      completeness: task.completeness,
      isComplete: task.completeness.isComplete
    });

    // Calculate and store RICE score if complete
    if (task.completeness.isComplete) {
      console.log('✅ Task is complete, calculating RICE score');
      const riceScore = this.calculateRICEScore(taskId);
      console.log('📈 Calculated RICE score:', riceScore);
      if (riceScore) {
        task.rice = riceScore;
        console.log('💾 RICE score stored in task');
      }
    } else {
      console.log('❌ Task not complete yet:', {
        hasReach: task.completeness.hasReach,
        hasImpact: task.completeness.hasImpact,
        hasConfidence: task.completeness.hasConfidence,
        hasEffort: task.completeness.hasEffort
      });
    }

    task.lastUpdated = new Date();

    this.saveToLocalStorage();
    return task;
  }

  canWriteToAirtable(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    return task?.completeness.isComplete || false;
  }

  getMissingParameters(taskId: string): string[] {
    const task = this.tasks.get(taskId);
    if (!task) return [];

    const missing: string[] = [];
    if (!task.completeness.hasReach) missing.push('reach');
    if (!task.completeness.hasImpact) missing.push('impact');
    if (!task.completeness.hasConfidence) missing.push('confidence');
    if (!task.completeness.hasEffort) missing.push('effort');

    return missing;
  }

  calculateRICEScore(taskId: string): RICEScore | null {
    const task = this.tasks.get(taskId);
    if (!task || !task.completeness.isComplete) return null;

    const { reach, impact, confidence, effort } = task.parameters;
    const score = ((reach! * impact! * confidence!) / effort!);

    return {
      reach: reach!,
      impact: impact!,
      confidence: confidence!,
      effort: effort!,
      score: Math.round(score * 100) / 100
    };
  }

  getPriorityQueue(): TaskState[] {
    return Array.from(this.tasks.values())
      .filter(t => !t.completeness.isComplete)
      .sort((a, b) => {
        // Prioritize tasks closer to completion
        const aComplete = Object.values(a.parameters).filter(val => val !== undefined).length;
        const bComplete = Object.values(b.parameters).filter(val => val !== undefined).length;
        return bComplete - aComplete;
      });
  }

  getTaskById(taskId: string): TaskState | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): TaskState[] {
    return Array.from(this.tasks.values());
  }

  getCompleteTasks(): TaskState[] {
    return Array.from(this.tasks.values())
      .filter(task => task.completeness.isComplete);
  }

  getIncompleteTasks(): TaskState[] {
    return Array.from(this.tasks.values())
      .filter(task => !task.completeness.isComplete);
  }

  updateTaskMetadata(taskId: string, metadata: Partial<TaskState['metadata']>): TaskState | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    // Update metadata fields
    Object.assign(task.metadata, metadata);
    task.lastUpdated = new Date();

    this.saveToLocalStorage();
    return task;
  }

  markAsSynced(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.syncStatus = 'synced';
      task.lastUpdated = new Date();
      this.saveToLocalStorage();
    }
  }

  updateTaskStatus(taskId: string, status: TaskStatus): TaskState | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = status;
    task.lastUpdated = new Date();
    this.saveToLocalStorage();
    return task;
  }

  deleteTask(taskId: string): boolean {
    const deleted = this.tasks.delete(taskId);
    if (deleted) {
      this.saveToLocalStorage();
    }
    return deleted;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Get state summary for OpenAI context
  getStateSummary(): string {
    const incompleteTasks = this.getIncompleteTasks();
    const completeTasks = this.getCompleteTasks();

    let summary = `Session: ${this.sessionId}\n`;
    summary += `Active Tasks: ${incompleteTasks.length}\n`;
    summary += `Completed Tasks: ${completeTasks.length}\n\n`;

    if (incompleteTasks.length > 0) {
      summary += "Incomplete Tasks:\n";
      incompleteTasks.forEach(task => {
        const missing = this.getMissingParameters(task.id);
        const progress = 4 - missing.length;
        summary += `- ${task.description} (${progress}/4 parameters) - Missing: ${missing.join(', ')}\n`;
      });
    }

    if (completeTasks.length > 0) {
      summary += "\nReady for Airtable:\n";
      completeTasks.forEach(task => {
        const rice = this.calculateRICEScore(task.id);
        summary += `- ${task.description} (RICE: ${rice?.score})\n`;
      });
    }

    return summary;
  }

  // Task Queue Management
  setCurrentFocusTask(taskId: string): void {
    if (this.tasks.has(taskId)) {
      this.currentFocusTaskId = taskId;
      this.saveToLocalStorage();
    }
  }

  getCurrentFocusTask(): TaskState | null {
    if (!this.currentFocusTaskId) return null;
    return this.tasks.get(this.currentFocusTaskId) || null;
  }

  addToQueue(taskId: string): void {
    if (!this.taskQueue.includes(taskId)) {
      this.taskQueue.push(taskId);
      this.saveToLocalStorage();
    }
  }

  getNextQueuedTask(): TaskState | null {
    // Find the next incomplete task in queue
    for (const taskId of this.taskQueue) {
      const task = this.tasks.get(taskId);
      if (task && !task.completeness.isComplete) {
        return task;
      }
    }
    return null;
  }

  moveToNextTask(): TaskState | null {
    const nextTask = this.getNextQueuedTask();
    if (nextTask) {
      this.currentFocusTaskId = nextTask.id;
      this.saveToLocalStorage();
      return nextTask;
    }
    return null;
  }

  getTaskQueue(): string[] {
    return this.taskQueue;
  }

  // Enhanced state summary with focus info
  getStateSummaryWithFocus(): string {
    const baseSummary = this.getStateSummary();

    if (this.currentFocusTaskId) {
      const focusTask = this.getCurrentFocusTask();
      if (focusTask) {
        const missing = this.getMissingParameters(focusTask.id);
        return `CURRENT FOCUS: ${focusTask.description}\nMissing: ${missing.join(', ')}\n\n${baseSummary}`;
      }
    }

    return baseSummary;
  }

  // Clear all data (for testing)
  clearAll(): void {
    this.tasks.clear();
    this.currentFocusTaskId = null;
    this.taskQueue = [];
    localStorage.removeItem('bishma_conversation_context');
  }
}