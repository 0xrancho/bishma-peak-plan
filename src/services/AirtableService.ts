import { TaskState, RICEScore } from '../types/TaskState';

export interface AirtableTask {
  id?: string;
  description: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rice_score: number;
  status: string;
  created_at: string;
  updated_at: string;
  session_id: string;
  category?: string;
  deadline?: string;
  dependencies?: string[];
}

export class AirtableService {
  public apiKey: string;
  public baseId: string;
  private tasksTableId: string = 'tblgA4jVOsYj0h76k';
  private dailyPlansTableId: string = 'tblhOWmlbs8o0UZHg';
  private preferencesTableId: string = 'tblwmXxkZcQPdC0Np';
  private baseUrl: string = 'https://api.airtable.com/v0';

  constructor(apiKey: string, baseId: string) {
    this.apiKey = apiKey;
    this.baseId = baseId;
  }

  async createTask(taskState: TaskState, riceScore: RICEScore, sessionId: string, userId: string): Promise<string> {
    console.log('📝 AirtableService.createTask called with:', {
      taskId: taskState.id,
      taskDescription: taskState.description,
      riceScore,
      sessionId,
      userId
    });

    // Only include fields that can be written to (not computed fields)
    const record = {
      // Multi-tenant isolation
      user_id: userId,

      // Core RICE fields - using correct Airtable field names
      Name: taskState.description,  // Task description goes to "Name" field (what you see)
      description: taskState.id,  // Task ID goes to "description" field
      reach: riceScore.reach,
      impact: riceScore.impact,
      confidence: riceScore.confidence,
      effort: riceScore.effort,
      // Note: rice_score is computed automatically by Airtable formula

      // Status and categorization
      status: 'pending',
      category: taskState.metadata.category || 'work',

      // Conversation tracking
      conversation_log: JSON.stringify(taskState.conversationLog || []),
      extraction_confidence: 'explicit', // Since we extracted via conversation

      // Optional fields
      ...(taskState.metadata.deadline && { due_date: taskState.metadata.deadline.toISOString().split('T')[0] }),
      project: taskState.metadata.category || 'General'
    };

    console.log('📤 Airtable Request:', {
      url: `${this.baseUrl}/${this.baseId}/${this.tasksTableId}`,
      method: 'POST',
      payload: { fields: record }
    });

    try {
      const response = await fetch(`${this.baseUrl}/${this.baseId}/${this.tasksTableId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: record
        })
      });

      console.log('📥 Airtable Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('❌ Airtable API error:', response.status, response.statusText, errorBody);
        throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const data = await response.json();
      console.log('✅ Airtable record created successfully:', {
        recordId: data.id,
        createdFields: data.fields
      });
      return data.id;

    } catch (error) {
      console.error('❌ Airtable create failed:', error);
      throw error;
    }
  }

  async updateTask(airtableId: string, updates: Partial<AirtableTask>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.baseId}/${this.tasksTableId}/${airtableId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            ...updates,
            updated_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      console.error('Airtable update failed:', error);
      throw error;
    }
  }

  async getTasks(userId: string, sessionId?: string): Promise<AirtableTask[]> {
    try {
      // Build filter formula - always filter by userId, optionally by sessionId
      let filterFormula = `{user_id}='${userId}'`;
      if (sessionId) {
        filterFormula = `AND({user_id}='${userId}', {session_id}='${sessionId}')`;
      }

      console.log('📡 Fetching tasks with filter:', filterFormula);

      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/${this.tasksTableId}?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=rice_score&sort[0][direction]=desc`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Airtable API error response:', errorText);
        throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Tasks fetched:', data.records?.length || 0);
      return data.records.map((record: any) => ({
        id: record.id,
        ...record.fields
      }));

    } catch (error) {
      console.error('Airtable fetch failed:', error);
      throw error;
    }
  }

  async deleteTask(airtableId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.baseId}/${this.tasksTableId}/${airtableId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      console.error('Airtable delete failed:', error);
      throw error;
    }
  }

  // User Preferences methods
  async getUserPreferences(userId: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.baseId}/${this.preferencesTableId}?filterByFormula=${encodeURIComponent(`{user_id}='${userId}'`)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.records.length === 0) {
        return null; // No preferences found - new user
      }

      return {
        id: data.records[0].id,
        ...data.records[0].fields
      };

    } catch (error) {
      console.error('Airtable fetch preferences failed:', error);
      throw error;
    }
  }

  async createUserPreferences(userId: string, preferences: {
    timezone: string;
    notification_channel?: string;
    notification_enabled?: boolean;
    ai_personality: 'wise-ol-sage' | 'helpful-assistant' | 'inspiring-life-coach';
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.baseId}/${this.preferencesTableId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            user_id: userId,
            timezone: preferences.timezone,
            notification_channel: preferences.notification_channel || '',
            notification_enabled: preferences.notification_enabled ?? true,
            ai_personality: preferences.ai_personality,
            created_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const data = await response.json();
      return data.id;

    } catch (error) {
      console.error('Airtable create preferences failed:', error);
      throw error;
    }
  }

  async updateUserPreferences(recordId: string, preferences: Partial<{
    timezone: string;
    notification_channel: string;
    notification_enabled: boolean;
    ai_personality: 'wise-ol-sage' | 'helpful-assistant' | 'inspiring-life-coach';
  }>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.baseId}/${this.preferencesTableId}/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            ...preferences,
            updated_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      console.error('Airtable update preferences failed:', error);
      throw error;
    }
  }

  // Validate API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.baseId}/${this.tasksTableId}?maxRecords=1`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      return response.ok;

    } catch (error) {
      console.error('Airtable connection test failed:', error);
      return false;
    }
  }
}