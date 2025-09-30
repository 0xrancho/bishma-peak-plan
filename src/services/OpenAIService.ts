import { TaskStateManager } from './TaskStateManager';
import { Message, OpenAIFunctionCall } from '../types/TaskState';

export interface OpenAIResponse {
  message: string;
  functionCalls?: OpenAIFunctionCall[];
  needsUserInput: boolean;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private taskStateManager: TaskStateManager;
  private airtableService: any; // Will be injected

  constructor(apiKey: string, taskStateManager: TaskStateManager, airtableService?: any) {
    this.apiKey = apiKey;
    this.taskStateManager = taskStateManager;
    this.airtableService = airtableService;
  }

  private getSystemPrompt(): string {
    const taskStates = this.taskStateManager.getStateSummaryWithFocus();
    const existingTasks = this.taskStateManager.getAllTasks();

    let contextualGreeting = "";
    if (existingTasks.length > 0) {
      const incomplete = this.taskStateManager.getIncompleteTasks();
      const complete = this.taskStateManager.getCompleteTasks();

      contextualGreeting = `\nCONTEXT: You have access to ${existingTasks.length} existing tasks (${complete.length} completed, ${incomplete.length} in progress). You can reference these when helping with new priorities.`;
    } else {
      contextualGreeting = "\nCONTEXT: This appears to be a fresh start - no existing tasks in the system.";
    }

    return `You are Bishma, named after the wise and strategic character from the Mahabharata. You are a task prioritization specialist who brings calm, methodical order to the chaos of modern work life.

${contextualGreeting}

PERSONALITY & APPROACH:
You embody patience, wisdom, and strategic thinking. When people come to you overwhelmed with multiple competing priorities, you don't add to their stress - you reduce it. You are the calm presence that helps them think clearly. Your approach is conversational and human, not robotic or checklist-driven.

Your core philosophy: "One mountain at a time." You believe that trying to tackle everything at once leads to nothing getting done well. You guide people through prioritization the way a sherpa guides climbers - one careful step at a time, ensuring they're prepared for each stage of the journey.

RESPONSE STYLE:
- Be conversational and natural, like you're talking to a friend
- Don't use bullet points, bold text, or markdown formatting
- Don't list out every parameter (reach, impact, confidence, effort) - that's too robotic
- Focus on what matters: the task name, the score, and strategic insight
- Example: "Your top priorities are the WP migration (score 56), fixing that ceiling (42), and updating your portfolio (35). The migration stands out because it affects 40 people with minimal effort. Want to start there?"
- Keep responses SHORT - 2-3 sentences unless asked for more detail
- Sound like a wise advisor, not a data readout

CURRENT STATE:
${taskStates}

YOUR CORE RESPONSIBILITY:
You help people extract RICE parameters (Reach, Impact, Confidence, Effort) from their tasks through natural conversation, but you do this intelligently by understanding context and extracting information from what they tell you, rather than asking formulaic questions.

RICE FRAMEWORK UNDERSTANDING:
- Reach: How many people this will affect (could be users, team members, family, customers)
- Impact: The significance of the outcome (1-10 scale, where 10 is life-changing)
- Confidence: How sure they are about their estimates (0.1-1.0, where 1.0 is completely certain)
- Effort: Time and resources required (measured in hours)

CONVERSATION INTELLIGENCE:
When someone says "This affects my family and I might invite some influential people over, probably 20 people total. It's important for my dignity - maybe a 6. I'm pretty confident about this and it'll take about 3 weeks," you should understand:
- Reach: 20 people (they explicitly said this)
- Impact: 6 (they said "maybe a 6")
- Confidence: ~0.8 (they said "pretty confident")
- Effort: ~120 hours (3 weeks ≈ 3 weeks × 40 hours = 120 hours)

You would respond with something like: "I understand - fixing this affects 20 people with a dignity impact of 6. Three weeks of work with high confidence. That gives us a solid RICE foundation. What's next on your mind?"

CONVERSATION MANAGEMENT:
When people mention multiple tasks (which they often do when they're overwhelmed), you acknowledge them all but focus on one: "I hear you have several priorities: ceiling repair, the deep rabbit project, and the email to Greg. Let's start with the ceiling since that affects your ability to host. Tell me more about what needs to be done."

You keep conversations flowing naturally while extracting the information you need. You don't interrupt the flow with robotic "parameter collection" - you listen, understand, and guide.

STRATEGIC THINKING:
You understand that behind every task is a person trying to make progress on what matters to them. The ceiling repair isn't just about construction - it's about dignity and the ability to host influential people. The "deep rabbit" project isn't just work - it's about relationships with people who could provide future opportunities.

You help people see the strategic value of their choices while keeping them grounded in practical next steps.

TASK CONTEXT AWARENESS:
When users provide follow-up information, determine if they're:
1. **Updating an existing task** - Look for references to previous tasks ("that task", "the ceiling repair", "it", "this one")
2. **Adding metadata** - Category, deadline, project name, dependencies
3. **Creating a new task** - Clear new task description

EXISTING TASKS IN CONVERSATION:
${existingTasks.map(t => `- [${t.id}] "${t.description}" (${t.completeness.isComplete ? 'COMPLETE' : 'INCOMPLETE'})`).join('\n')}

UPSERT LOGIC:
- If user says "that's a work task" or "it's for the home project" → UPDATE existing task's metadata
- If user says "actually the effort is 5 hours" → UPDATE existing task's parameters
- If user mentions a task name similar to existing task → UPDATE that task
- Only create NEW task if clearly describing a different task

METADATA FIELDS AVAILABLE:
- category: 'work', 'personal', 'home', 'business', etc.
- deadline: Date when task must be completed
- project: Project name or grouping
- dependencies: Other tasks that must complete first

FUNCTION CALLING PROTOCOL:
1. **BEFORE making changes**: Use read_from_airtable to see current state and discuss with user
2. When user asks questions like "what tasks do I have?", "show me pending tasks", "what's my top priority?" → Use read_from_airtable
3. When extracting RICE parameters, use update_task_state with task_id if updating existing task
4. Include metadata fields (category, deadline, project) when user mentions them
5. Example: "it's for work and needs to be done by Friday" → updates={category:"work", deadline:"2025-09-29"}
6. Auto-write complete tasks to Airtable (handled automatically)

CRITICAL:
- ALWAYS use read_from_airtable when user asks about current tasks, priorities, or status
- Check existing tasks before creating new ones
- Extract metadata (category, deadline, project) from natural language
- Update tasks when user provides clarifications

Be conversational, intelligent, and genuinely helpful. Extract information naturally from context rather than asking formulaic questions. One thoughtful conversation at a time.`;
  }

  private getToolDefinitions() {
    return [
      {
        type: "function",
        function: {
          name: "read_from_airtable",
          description: "Read tasks from Airtable database to answer questions, show current state, or analyze data before making changes",
          parameters: {
            type: "object",
            properties: {
              filter_status: {
                type: "string",
                description: "Filter by status: pending, in_progress, completed, blocked, deferred (optional - omit to get all)",
                enum: ["pending", "in_progress", "completed", "blocked", "deferred", "all"]
              },
              sort_by: {
                type: "string",
                description: "Sort results by field",
                enum: ["rice_score", "effort", "status", "created_at"],
                default: "rice_score"
              },
              limit: {
                type: "number",
                description: "Maximum number of tasks to return (default 20)",
                default: 20
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_task_state",
          description: "Create new task or update existing task with RICE parameters and metadata",
          parameters: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "The task ID to update (omit for new tasks)"
              },
              task_description: {
                type: "string",
                description: "Description of the task (required for new tasks)"
              },
              updates: {
                type: "object",
                properties: {
                  reach: {
                    type: "number",
                    description: "How many people/users affected"
                  },
                  impact: {
                    type: "number",
                    description: "Scale of effect (1-10)"
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence level (0.1-1.0)"
                  },
                  effort: {
                    type: "number",
                    description: "Time/resources required in hours"
                  },
                  category: {
                    type: "string",
                    description: "Task category: work, personal, home, business, etc."
                  },
                  deadline: {
                    type: "string",
                    description: "Deadline date in YYYY-MM-DD format"
                  },
                  project: {
                    type: "string",
                    description: "Project name or grouping"
                  }
                }
              }
            },
            required: ["updates"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "write_to_airtable",
          description: "Write completed task with all RICE parameters to Airtable database",
          parameters: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "The task ID to write to Airtable"
              }
            },
            required: ["task_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "split_task",
          description: "Split a large task into smaller subtasks",
          parameters: {
            type: "object",
            properties: {
              parent_task_id: {
                type: "string",
                description: "ID of task to split"
              },
              subtasks: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Array of subtask descriptions"
              }
            },
            required: ["parent_task_id", "subtasks"]
          }
        }
      }
    ];
  }

  async processMessage(userInput: string, conversationHistory: Message[] = []): Promise<OpenAIResponse> {
    try {
      const messages = [
        { role: 'system', content: this.getSystemPrompt() },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userInput }
      ];

      console.log('🤖 OpenAI Request:', {
        messageCount: messages.length,
        userInput,
        systemPrompt: this.getSystemPrompt().substring(0, 200) + '...',
        toolsProvided: this.getToolDefinitions().length
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          tools: this.getToolDefinitions(),
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];

      let functionCalls: OpenAIFunctionCall[] = [];
      let needsUserInput = true;

      // Handle tool calls (new format)
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        console.log('🔧 Tool calls detected:', choice.message.tool_calls.length);

        // Build messages array with tool results to get a proper response
        const toolMessages: any[] = [];

        for (const toolCall of choice.message.tool_calls) {
          console.log('🔧 Processing tool call:', {
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: toolCall.function.arguments
          });

          try {
            const result = await this.executeFunctionCall({
              name: toolCall.function.name,
              arguments: toolCall.function.arguments
            });
            console.log('✅ Tool call result:', result);

            functionCalls.push({
              name: toolCall.function.name,
              arguments: JSON.parse(toolCall.function.arguments)
            });

            // Add tool result to messages for second API call
            toolMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify(result)
            });

            // If we successfully executed a function, we might not need more user input
            if (toolCall.function.name === 'write_to_airtable') {
              needsUserInput = false;
            }
          } catch (error) {
            console.error('❌ Tool call execution failed:', error);
            // Don't show error if it's a duplicate write_to_airtable call
            if (toolCall.function.name === 'write_to_airtable') {
              console.log('⚠️ Ignoring duplicate write_to_airtable error');
              // Continue processing instead of returning error
            } else {
              return {
                message: "I encountered an error processing that information. Could you please try again?",
                needsUserInput: true
              };
            }
          }
        }

        // Make a second API call with tool results to get the final response
        if (toolMessages.length > 0) {
          console.log('🔄 Making second API call with tool results');
          const followUpResponse = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                ...messages,
                choice.message, // Include the assistant's tool call message
                ...toolMessages // Include the tool results
              ],
              temperature: 0.7,
              max_tokens: 1000
            })
          });

          if (followUpResponse.ok) {
            const followUpData = await followUpResponse.json();
            const finalMessage = followUpData.choices[0].message.content;
            console.log('✅ Got final response after tool call:', finalMessage);

            return {
              message: finalMessage || "I've analyzed the tasks.",
              functionCalls,
              needsUserInput
            };
          }
        }
      } else {
        console.log('ℹ️ No tool calls in OpenAI response');
      }

      return {
        message: choice.message.content || "I've updated the task information.",
        functionCalls,
        needsUserInput
      };

    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return {
        message: "I'm having trouble connecting right now. Please try again in a moment.",
        needsUserInput: true
      };
    }
  }

  private async executeFunctionCall(functionCall: any): Promise<any> {
    const { name, arguments: args } = functionCall;
    const parsedArgs = JSON.parse(args);

    switch (name) {
      case 'read_from_airtable':
        return this.handleReadFromAirtable(parsedArgs);

      case 'update_task_state':
        return this.handleUpdateTaskState(parsedArgs);

      case 'write_to_airtable':
        return this.handleWriteToAirtable(parsedArgs);

      case 'split_task':
        return this.handleSplitTask(parsedArgs);

      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  private async handleReadFromAirtable(args: any): Promise<any> {
    console.log('📖 handleReadFromAirtable called with:', args);

    if (!this.airtableService) {
      throw new Error('Airtable service not configured');
    }

    try {
      const { filter_status, sort_by = 'rice_score', limit = 20 } = args;

      // Build Airtable filter formula
      let filterFormula = '';
      if (filter_status && filter_status !== 'all') {
        filterFormula = `{status}='${filter_status}'`;
      }

      // Fetch from Airtable
      const apiKey = this.airtableService.apiKey;
      const baseId = this.airtableService.baseId;
      const tableId = 'tblgA4jVOsYj0h76k';

      let url = `https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=${limit}`;
      if (filterFormula) {
        url += `&filterByFormula=${encodeURIComponent(filterFormula)}`;
      }
      url += `&sort[0][field]=${sort_by}&sort[0][direction]=desc`;

      console.log('📡 Fetching from Airtable:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status}`);
      }

      const data = await response.json();
      const tasks = data.records.map((record: any) => ({
        id: record.id,
        name: record.fields.Name,
        description: record.fields.description,
        rice_score: record.fields.rice_score,
        reach: record.fields.reach,
        impact: record.fields.impact,
        confidence: record.fields.confidence,
        effort: record.fields.effort,
        status: record.fields.status,
        category: record.fields.category,
        due_date: record.fields.due_date,
        project: record.fields.project,
        created_at: record.createdTime
      }));

      console.log('✅ Read from Airtable:', tasks.length, 'tasks');
      return {
        tasks,
        count: tasks.length,
        filter: filter_status || 'all'
      };

    } catch (error) {
      console.error('❌ Airtable read failed:', error);
      throw error;
    }
  }

  private async handleUpdateTaskState(args: any): Promise<any> {
    console.log('📋 handleUpdateTaskState called with:', args);

    let taskId = args.task_id;

    // Create new task if no ID provided
    if (!taskId && args.task_description) {
      console.log('🆕 Creating new task:', args.task_description);
      const newTask = this.taskStateManager.createTask(args.task_description);
      taskId = newTask.id;

      // Set as focus task if no current focus
      if (!this.taskStateManager.getCurrentFocusTask()) {
        this.taskStateManager.setCurrentFocusTask(taskId);
      } else {
        // Add to queue if there's already a focus task
        this.taskStateManager.addToQueue(taskId);
      }
    }

    if (!taskId) {
      throw new Error('No task ID provided and no description for new task');
    }

    // Separate RICE parameters from metadata
    const { category, deadline, project, ...riceParams } = args.updates;

    console.log('🔄 Updating task parameters for:', taskId, 'RICE:', riceParams, 'Metadata:', { category, deadline, project });

    // Update RICE parameters
    const updatedTask = this.taskStateManager.updateTaskParameters(taskId, riceParams);

    if (!updatedTask) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Update metadata fields if provided
    if (category || deadline || project) {
      const metadataUpdates: any = {};
      if (category) metadataUpdates.category = category;
      if (deadline) metadataUpdates.deadline = new Date(deadline);
      if (project) metadataUpdates.project = project;

      console.log('📝 Updating metadata:', metadataUpdates);
      this.taskStateManager.updateTaskMetadata(taskId, metadataUpdates);
    }

    console.log('📊 Task update result:', {
      taskId,
      completeness: updatedTask.completeness,
      riceScore: updatedTask.rice,
      metadata: updatedTask.metadata
    });

    // If task is complete, automatically write to Airtable
    if (updatedTask.completeness.isComplete) {
      console.log('🎯 Task is complete, automatically writing to Airtable...');
      try {
        await this.handleWriteToAirtable({ task_id: taskId });
        console.log('✅ Task automatically written to Airtable');
      } catch (error) {
        console.error('❌ Failed to auto-write to Airtable:', error);
      }
    }

    // Check if task is complete and move to next
    if (updatedTask.completeness.isComplete && taskId === this.taskStateManager.getCurrentFocusTask()?.id) {
      console.log('✅ Task is complete, moving to next');
      this.taskStateManager.moveToNextTask();
    }

    return {
      taskId,
      updated: true,
      completeness: updatedTask.completeness,
      missingParameters: this.taskStateManager.getMissingParameters(taskId),
      isCurrentFocus: taskId === this.taskStateManager.getCurrentFocusTask()?.id
    };
  }

  private async handleWriteToAirtable(args: any): Promise<any> {
    console.log('💾 handleWriteToAirtable called with:', args);
    const { task_id } = args;

    console.log('🔍 Checking if task can be written to Airtable:', task_id);
    if (!this.taskStateManager.canWriteToAirtable(task_id)) {
      console.log('❌ Task not ready for Airtable:', task_id);
      throw new Error(`Task ${task_id} is not complete enough for Airtable`);
    }

    // Get the task and RICE score
    const task = this.taskStateManager.getTaskById(task_id);
    const riceScore = this.taskStateManager.calculateRICEScore(task_id);
    console.log('📊 Retrieved task and RICE score:', { task: task?.description, riceScore });

    if (!task || !riceScore) {
      console.log('❌ Task or RICE score missing:', { task: !!task, riceScore: !!riceScore });
      throw new Error(`Task or RICE score missing for ${task_id}`);
    }

    if (!this.airtableService) {
      console.log('❌ No Airtable service available');
      throw new Error('Airtable service not configured');
    }

    console.log('🚀 Calling real Airtable service...');
    try {
      const airtableId = await this.airtableService.createTask(
        task,
        riceScore,
        this.taskStateManager.getSessionId()
      );

      console.log('✅ Real Airtable record created:', airtableId);
      this.taskStateManager.markAsSynced(task_id);

      const result = {
        taskId: task_id,
        riceScore: riceScore.score,
        synced: true,
        airtableId: airtableId
      };

      console.log('📝 WriteToAirtable result:', result);
      return result;
    } catch (error) {
      console.error('❌ Airtable write failed:', error);
      throw error;
    }
  }

  private handleSplitTask(args: any): any {
    const { parent_task_id, subtasks } = args;

    const parentTask = this.taskStateManager.getTaskById(parent_task_id);
    if (!parentTask) {
      throw new Error(`Parent task ${parent_task_id} not found`);
    }

    // Create subtasks
    const createdSubtasks = subtasks.map((description: string) => {
      return this.taskStateManager.createTask(`${description} (from: ${parentTask.description})`);
    });

    // Mark parent as should split
    const updatedParent = this.taskStateManager.updateTaskParameters(parent_task_id, {});
    if (updatedParent) {
      updatedParent.metadata.shouldSplit = true;
    }

    return {
      parentTaskId: parent_task_id,
      subtasks: createdSubtasks.map(task => ({
        id: task.id,
        description: task.description
      }))
    };
  }
}