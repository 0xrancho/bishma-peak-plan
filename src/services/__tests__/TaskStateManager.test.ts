import { TaskStateManager } from '../TaskStateManager';
import { TaskState } from '../../types/TaskState';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('TaskStateManager', () => {
  let manager: TaskStateManager;

  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    manager = new TaskStateManager();
  });

  afterEach(() => {
    manager.clearAll();
  });

  describe('Task Creation', () => {
    test('should create a new task with correct initial state', () => {
      const description = 'Fix API bug affecting payments';
      const task = manager.createTask(description);

      expect(task.id).toBeDefined();
      expect(task.description).toBe(description);
      expect(task.parameters).toEqual({});
      expect(task.completeness.isComplete).toBe(false);
      expect(task.syncStatus).toBe('pending');
    });

    test('should generate unique IDs for multiple tasks', () => {
      const task1 = manager.createTask('Task 1');
      const task2 = manager.createTask('Task 2');

      expect(task1.id).not.toBe(task2.id);
    });
  });

  describe('Parameter Updates', () => {
    test('should update parameters and completeness flags', () => {
      const task = manager.createTask('Board meeting prep');

      const updated = manager.updateTaskParameters(task.id, {
        reach: 12,
        impact: 8
      });

      expect(updated).toBeTruthy();
      expect(updated!.parameters.reach).toBe(12);
      expect(updated!.parameters.impact).toBe(8);
      expect(updated!.completeness.hasReach).toBe(true);
      expect(updated!.completeness.hasImpact).toBe(true);
      expect(updated!.completeness.hasConfidence).toBe(false);
      expect(updated!.completeness.hasEffort).toBe(false);
      expect(updated!.completeness.isComplete).toBe(false);
    });

    test('should mark task as complete when all parameters are set', () => {
      const task = manager.createTask('API bug fix');

      manager.updateTaskParameters(task.id, {
        reach: 500,
        impact: 9,
        confidence: 0.8,
        effort: 2
      });

      const updated = manager.getTaskById(task.id);
      expect(updated!.completeness.isComplete).toBe(true);
    });

    test('should return null for non-existent task', () => {
      const result = manager.updateTaskParameters('invalid-id', { reach: 10 });
      expect(result).toBeNull();
    });
  });

  describe('RICE Score Calculation', () => {
    test('should calculate correct RICE score for complete task', () => {
      const task = manager.createTask('Payment API fix');

      manager.updateTaskParameters(task.id, {
        reach: 500,
        impact: 9,
        confidence: 0.8,
        effort: 2
      });

      const riceScore = manager.calculateRICEScore(task.id);

      expect(riceScore).toBeTruthy();
      expect(riceScore!.reach).toBe(500);
      expect(riceScore!.impact).toBe(9);
      expect(riceScore!.confidence).toBe(0.8);
      expect(riceScore!.effort).toBe(2);
      expect(riceScore!.score).toBe(1800); // (500 * 9 * 0.8) / 2
    });

    test('should return null for incomplete task', () => {
      const task = manager.createTask('Incomplete task');

      manager.updateTaskParameters(task.id, {
        reach: 100
      });

      const riceScore = manager.calculateRICEScore(task.id);
      expect(riceScore).toBeNull();
    });

    test('should return null for non-existent task', () => {
      const riceScore = manager.calculateRICEScore('invalid-id');
      expect(riceScore).toBeNull();
    });
  });

  describe('Missing Parameters', () => {
    test('should identify missing parameters correctly', () => {
      const task = manager.createTask('Test task');

      // No parameters set
      let missing = manager.getMissingParameters(task.id);
      expect(missing).toEqual(['reach', 'impact', 'confidence', 'effort']);

      // Set some parameters
      manager.updateTaskParameters(task.id, {
        reach: 100,
        confidence: 0.9
      });

      missing = manager.getMissingParameters(task.id);
      expect(missing).toEqual(['impact', 'effort']);

      // Set all parameters
      manager.updateTaskParameters(task.id, {
        impact: 7,
        effort: 3
      });

      missing = manager.getMissingParameters(task.id);
      expect(missing).toEqual([]);
    });

    test('should return empty array for non-existent task', () => {
      const missing = manager.getMissingParameters('invalid-id');
      expect(missing).toEqual([]);
    });
  });

  describe('Airtable Sync', () => {
    test('should allow writing to Airtable only for complete tasks', () => {
      const incompleteTask = manager.createTask('Incomplete');
      const completeTask = manager.createTask('Complete');

      manager.updateTaskParameters(completeTask.id, {
        reach: 100,
        impact: 5,
        confidence: 0.7,
        effort: 1
      });

      expect(manager.canWriteToAirtable(incompleteTask.id)).toBe(false);
      expect(manager.canWriteToAirtable(completeTask.id)).toBe(true);
    });

    test('should update sync status correctly', () => {
      const task = manager.createTask('Sync test');

      manager.updateTaskParameters(task.id, {
        reach: 50,
        impact: 6,
        confidence: 0.8,
        effort: 2
      });

      expect(manager.getTaskById(task.id)!.syncStatus).toBe('pending');

      manager.markAsSynced(task.id);

      expect(manager.getTaskById(task.id)!.syncStatus).toBe('synced');
    });
  });

  describe('Priority Queue', () => {
    test('should prioritize tasks closer to completion', () => {
      const task1 = manager.createTask('No params');
      const task2 = manager.createTask('Two params');
      const task3 = manager.createTask('Three params');

      manager.updateTaskParameters(task2.id, {
        reach: 100,
        impact: 5
      });

      manager.updateTaskParameters(task3.id, {
        reach: 200,
        impact: 8,
        confidence: 0.9
      });

      const queue = manager.getPriorityQueue();

      expect(queue[0].id).toBe(task3.id); // 3 parameters
      expect(queue[1].id).toBe(task2.id); // 2 parameters
      expect(queue[2].id).toBe(task1.id); // 0 parameters
    });

    test('should exclude completed tasks from priority queue', () => {
      const incompleteTask = manager.createTask('Incomplete');
      const completeTask = manager.createTask('Complete');

      manager.updateTaskParameters(completeTask.id, {
        reach: 100,
        impact: 5,
        confidence: 0.7,
        effort: 1
      });

      const queue = manager.getPriorityQueue();

      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(incompleteTask.id);
    });
  });

  describe('Task Retrieval', () => {
    test('should retrieve tasks by completion status', () => {
      const incomplete = manager.createTask('Incomplete');
      const complete = manager.createTask('Complete');

      manager.updateTaskParameters(complete.id, {
        reach: 100,
        impact: 5,
        confidence: 0.7,
        effort: 1
      });

      expect(manager.getIncompleteTasks()).toHaveLength(1);
      expect(manager.getIncompleteTasks()[0].id).toBe(incomplete.id);

      expect(manager.getCompleteTasks()).toHaveLength(1);
      expect(manager.getCompleteTasks()[0].id).toBe(complete.id);

      expect(manager.getAllTasks()).toHaveLength(2);
    });
  });

  describe('State Summary', () => {
    test('should generate accurate state summary', () => {
      const task1 = manager.createTask('API bug');
      const task2 = manager.createTask('Board prep');

      manager.updateTaskParameters(task1.id, {
        reach: 500,
        impact: 9
      });

      manager.updateTaskParameters(task2.id, {
        reach: 12,
        impact: 7,
        confidence: 0.9,
        effort: 2
      });

      const summary = manager.getStateSummary();

      expect(summary).toContain('Active Tasks: 1');
      expect(summary).toContain('Completed Tasks: 1');
      expect(summary).toContain('API bug (2/4 parameters)');
      expect(summary).toContain('Board prep (RICE:');
    });
  });

  describe('Data Persistence', () => {
    test('should save to localStorage on task creation', () => {
      manager.createTask('Test task');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bishma_conversation_context',
        expect.any(String)
      );
    });

    test('should save to localStorage on parameter update', () => {
      const task = manager.createTask('Test task');
      localStorageMock.setItem.mockClear();

      manager.updateTaskParameters(task.id, { reach: 100 });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bishma_conversation_context',
        expect.any(String)
      );
    });

    test('should clear localStorage on clearAll', () => {
      manager.createTask('Test task');
      manager.clearAll();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'bishma_conversation_context'
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle task deletion', () => {
      const task = manager.createTask('To be deleted');

      expect(manager.getTaskById(task.id)).toBeTruthy();

      const deleted = manager.deleteTask(task.id);

      expect(deleted).toBe(true);
      expect(manager.getTaskById(task.id)).toBeUndefined();
    });

    test('should handle deletion of non-existent task', () => {
      const deleted = manager.deleteTask('invalid-id');
      expect(deleted).toBe(false);
    });

    test('should generate unique session IDs', () => {
      const manager1 = new TaskStateManager();
      const manager2 = new TaskStateManager();

      expect(manager1.getSessionId()).not.toBe(manager2.getSessionId());
    });
  });
});