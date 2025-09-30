import { TaskStateManager } from './TaskStateManager';
import { OpenAIService, OpenAIResponse } from './OpenAIService';
import { AirtableService } from './AirtableService';
import { Message, TaskState } from '../types/TaskState';

export interface ConversationConfig {
  openaiApiKey: string;
  airtableApiKey: string;
  airtableBaseId: string;
}

export interface ConversationResponse {
  message: string;
  taskUpdates?: TaskState[];
  completedTasks?: TaskState[];
  error?: string;
}

export class ConversationManager {
  private taskStateManager: TaskStateManager;
  private openaiService: OpenAIService;
  private airtableService: AirtableService;
  private conversationHistory: Message[] = [];

  constructor(config: ConversationConfig) {
    this.taskStateManager = new TaskStateManager();
    this.airtableService = new AirtableService(config.airtableApiKey, config.airtableBaseId);
    this.openaiService = new OpenAIService(config.openaiApiKey, this.taskStateManager, this.airtableService);
  }

  async processUserInput(userInput: string): Promise<ConversationResponse> {
    try {
      // Add user message to history
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: userInput,
        timestamp: new Date()
      };
      this.conversationHistory.push(userMessage);

      // Get response from OpenAI with full conversation context
      const aiResponse: OpenAIResponse = await this.openaiService.processMessage(
        userInput,
        this.conversationHistory
      );

      // Add AI response to history
      const aiMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        functionCall: aiResponse.functionCalls?.[0]
      };
      this.conversationHistory.push(aiMessage);

      // Handle any completed tasks that need to be written to Airtable
      const completedTasks: TaskState[] = [];
      console.log('🔄 Processing function calls:', aiResponse.functionCalls?.length || 0);

      if (aiResponse.functionCalls) {
        for (const functionCall of aiResponse.functionCalls) {
          console.log('🎯 Processing function call:', functionCall.name);

          if (functionCall.name === 'write_to_airtable') {
            const taskId = functionCall.arguments.task_id;
            console.log('💾 Processing write_to_airtable for task:', taskId);

            const task = this.taskStateManager.getTaskById(taskId);

            if (task && this.taskStateManager.canWriteToAirtable(taskId)) {
              console.log('✅ Task found and ready for Airtable write');
              try {
                const riceScore = this.taskStateManager.calculateRICEScore(taskId);
                console.log('📊 RICE score calculated:', riceScore);

                if (riceScore) {
                  console.log('🚀 Calling Airtable service...');
                  const airtableId = await this.airtableService.createTask(
                    task,
                    riceScore,
                    this.taskStateManager.getSessionId()
                  );

                  console.log('✅ Airtable record created:', airtableId);
                  this.taskStateManager.markAsSynced(taskId);
                  completedTasks.push(task);

                  // Trigger dashboard update event
                  console.log('📡 Dispatching tasks-updated event for dashboard');
                  window.dispatchEvent(new CustomEvent('tasks-updated', {
                    detail: { source: 'airtable-write', taskId, airtableId }
                  }));
                } else {
                  console.log('❌ No RICE score available for task:', taskId);
                }
              } catch (error) {
                console.error('❌ Failed to write to Airtable:', error);
                return {
                  message: "I had trouble saving that task. Let me try again later.",
                  error: error instanceof Error ? error.message : 'Unknown error'
                };
              }
            } else {
              console.log('❌ Task not found or not ready for Airtable:', {
                taskFound: !!task,
                canWrite: task ? this.taskStateManager.canWriteToAirtable(taskId) : false
              });
            }
          }
        }
      }

      return {
        message: aiResponse.message,
        taskUpdates: this.taskStateManager.getIncompleteTasks(),
        completedTasks: completedTasks.length > 0 ? completedTasks : undefined
      };

    } catch (error) {
      console.error('❌ Conversation processing failed:', error);
      console.error('Conversation error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userInput: userInput,
        timestamp: new Date().toISOString()
      });
      return {
        message: "I'm having trouble processing that right now. Could you try rephrasing?",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get current state for UI
  getCurrentState() {
    return {
      incompleteTasks: this.taskStateManager.getIncompleteTasks(),
      completeTasks: this.taskStateManager.getCompleteTasks(),
      priorityQueue: this.taskStateManager.getPriorityQueue(),
      stateSummary: this.taskStateManager.getStateSummary(),
      sessionId: this.taskStateManager.getSessionId()
    };
  }

  // Get conversation history
  getConversationHistory(): Message[] {
    return this.conversationHistory;
  }

  // Handle queries about existing tasks
  async queryTasks(query: string): Promise<ConversationResponse> {
    const allTasks = this.taskStateManager.getAllTasks();
    const completeTasks = this.taskStateManager.getCompleteTasks();
    const incompleteTasks = this.taskStateManager.getIncompleteTasks();

    if (allTasks.length === 0) {
      return {
        message: "You don't have any tasks in the system yet. Tell me about something you need to prioritize and I'll help extract the RICE parameters.",
      };
    }

    // Check if they're asking about specific tasks from previous conversation
    if (query.toLowerCase().includes('ceiling') || query.toLowerCase().includes('hole')) {
      const ceilingTask = allTasks.find(t =>
        t.description.toLowerCase().includes('ceiling') ||
        t.description.toLowerCase().includes('hole')
      );

      if (ceilingTask) {
        const riceScore = this.taskStateManager.calculateRICEScore(ceilingTask.id);
        const status = ceilingTask.completeness.isComplete ? 'complete' : 'incomplete';

        return {
          message: `I found your ceiling task: "${ceilingTask.description}" - Status: ${status}${riceScore ? `, RICE Score: ${riceScore.score}` : ''}. What would you like to know about it?`,
          taskUpdates: [ceilingTask]
        };
      }
    }

    if (query.toLowerCase().includes('deeprabbit') || query.toLowerCase().includes('landing')) {
      const deeprabbitTask = allTasks.find(t =>
        t.description.toLowerCase().includes('deeprabbit') ||
        t.description.toLowerCase().includes('landing')
      );

      if (deeprabbitTask) {
        const riceScore = this.taskStateManager.calculateRICEScore(deeprabbitTask.id);
        const status = deeprabbitTask.completeness.isComplete ? 'complete' : 'incomplete';

        return {
          message: `I found your deeprabbit task: "${deeprabbitTask.description}" - Status: ${status}${riceScore ? `, RICE Score: ${riceScore.score}` : ''}. What would you like to know about it?`,
          taskUpdates: [deeprabbitTask]
        };
      }
    }

    // General task summary
    return {
      message: `I see ${allTasks.length} tasks in your system: ${completeTasks.length} completed, ${incompleteTasks.length} in progress. What would you like to know about them?`,
      taskUpdates: allTasks
    };
  }

  // Clear all data (for testing/reset)
  reset(): void {
    this.taskStateManager.clearAll();
    this.conversationHistory = [];
  }

  // Test all connections
  async testConnections(): Promise<{ openai: boolean; airtable: boolean }> {
    return {
      openai: true, // We'll test this with actual API call
      airtable: await this.airtableService.testConnection()
    };
  }

  // Get specific task details for UI
  getTaskProgress(taskId: string) {
    const task = this.taskStateManager.getTaskById(taskId);
    if (!task) return null;

    const missing = this.taskStateManager.getMissingParameters(taskId);
    const riceScore = this.taskStateManager.calculateRICEScore(taskId);

    return {
      task,
      missingParameters: missing,
      progress: (4 - missing.length) / 4,
      riceScore,
      canSync: this.taskStateManager.canWriteToAirtable(taskId)
    };
  }

  // Force sync a complete task to Airtable
  async forceSyncTask(taskId: string): Promise<boolean> {
    const task = this.taskStateManager.getTaskById(taskId);
    if (!task || !this.taskStateManager.canWriteToAirtable(taskId)) {
      return false;
    }

    try {
      const riceScore = this.taskStateManager.calculateRICEScore(taskId);
      if (riceScore) {
        await this.airtableService.createTask(
          task,
          riceScore,
          this.taskStateManager.getSessionId()
        );
        this.taskStateManager.markAsSynced(taskId);
        return true;
      }
    } catch (error) {
      console.error('Force sync failed:', error);
    }

    return false;
  }
}