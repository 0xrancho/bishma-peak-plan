import { TaskStateManager } from '../TaskStateManager';

/**
 * Test scenario from PRD: Board meeting + API bug conversation switching
 *
 * This test validates the asynchronous conversation flow where users:
 * 1. Mention multiple tasks in one message
 * 2. Switch context between tasks during conversation
 * 3. Provide partial information across multiple exchanges
 * 4. System tracks state correctly for both tasks
 */

describe('Conversation Switching Scenario', () => {
  let manager: TaskStateManager;

  beforeEach(() => {
    manager = new TaskStateManager();
  });

  afterEach(() => {
    manager.clearAll();
  });

  test('should handle the board meeting + API bug conversation flow', () => {
    // Simulate: "I need to prep for the board meeting and fix the API bug"
    const boardMeeting = manager.createTask('prep for the board meeting');
    const apiBug = manager.createTask('fix the API bug');

    // Initial state - both tasks exist but no parameters
    expect(manager.getMissingParameters(boardMeeting.id)).toEqual(['reach', 'impact', 'confidence', 'effort']);
    expect(manager.getMissingParameters(apiBug.id)).toEqual(['reach', 'impact', 'confidence', 'effort']);

    // Simulate: "Thursday" (for board meeting deadline)
    // No direct parameter update, but metadata could be tracked
    manager.getTaskById(boardMeeting.id)!.metadata.deadline = new Date('2024-01-11'); // Thursday

    // Simulate: "Actually, let me tell you about the API bug first - it's affecting 500 users"
    manager.updateTaskParameters(apiBug.id, {
      reach: 500
    });

    // Validate API bug state
    expect(manager.getTaskById(apiBug.id)!.parameters.reach).toBe(500);
    expect(manager.getMissingParameters(apiBug.id)).toEqual(['impact', 'confidence', 'effort']);
    expect(manager.getTaskById(apiBug.id)!.completeness.hasReach).toBe(true);

    // Simulate: "Payment processing. Oh and the board meeting has 12 attendees"
    manager.updateTaskParameters(apiBug.id, {
      impact: 9 // High impact for payment processing
    });

    manager.updateTaskParameters(boardMeeting.id, {
      reach: 12
    });

    // Validate both tasks updated correctly
    expect(manager.getTaskById(apiBug.id)!.parameters.impact).toBe(9);
    expect(manager.getMissingParameters(apiBug.id)).toEqual(['confidence', 'effort']);

    expect(manager.getTaskById(boardMeeting.id)!.parameters.reach).toBe(12);
    expect(manager.getMissingParameters(boardMeeting.id)).toEqual(['impact', 'confidence', 'effort']);

    // Simulate: "Maybe 2 hours" (for API bug effort)
    manager.updateTaskParameters(apiBug.id, {
      effort: 2
    });

    expect(manager.getTaskById(apiBug.id)!.parameters.effort).toBe(2);
    expect(manager.getMissingParameters(apiBug.id)).toEqual(['confidence']);

    // Simulate: "Pretty confident, like 80%" (for API bug confidence)
    manager.updateTaskParameters(apiBug.id, {
      confidence: 0.8
    });

    // API bug should now be complete
    const apiBugComplete = manager.getTaskById(apiBug.id)!;
    expect(apiBugComplete.completeness.isComplete).toBe(true);
    expect(manager.canWriteToAirtable(apiBug.id)).toBe(true);

    // Calculate RICE score for API bug
    const apiBugRice = manager.calculateRICEScore(apiBug.id);
    expect(apiBugRice).toBeTruthy();
    expect(apiBugRice!.score).toBe(1800); // (500 * 9 * 0.8) / 2

    // Board meeting should still be incomplete
    expect(manager.getTaskById(boardMeeting.id)!.completeness.isComplete).toBe(false);
    expect(manager.getMissingParameters(boardMeeting.id)).toEqual(['impact', 'confidence', 'effort']);

    // Priority queue should prioritize board meeting (incomplete) over API bug (complete)
    const queue = manager.getPriorityQueue();
    expect(queue).toHaveLength(1); // Only incomplete tasks
    expect(queue[0].id).toBe(boardMeeting.id);

    // Simulate continuing with board meeting parameters
    manager.updateTaskParameters(boardMeeting.id, {
      impact: 7, // Moderate impact
      confidence: 0.9,
      effort: 1.5
    });

    // Board meeting should now be complete
    const boardMeetingComplete = manager.getTaskById(boardMeeting.id)!;
    expect(boardMeetingComplete.completeness.isComplete).toBe(true);
    expect(manager.canWriteToAirtable(boardMeeting.id)).toBe(true);

    // Calculate RICE score for board meeting
    const boardMeetingRice = manager.calculateRICEScore(boardMeeting.id);
    expect(boardMeetingRice).toBeTruthy();
    expect(boardMeetingRice!.score).toBe(50.4); // (12 * 7 * 0.9) / 1.5

    // Final state validation
    expect(manager.getCompleteTasks()).toHaveLength(2);
    expect(manager.getIncompleteTasks()).toHaveLength(0);
    expect(manager.getPriorityQueue()).toHaveLength(0);

    // API bug should have higher priority than board meeting (higher RICE score)
    const completeTasks = manager.getCompleteTasks();
    const apiTask = completeTasks.find(t => t.id === apiBug.id);
    const boardTask = completeTasks.find(t => t.id === boardMeeting.id);

    const apiRice = manager.calculateRICEScore(apiTask!.id)!;
    const boardRice = manager.calculateRICEScore(boardTask!.id)!;

    expect(apiRice.score).toBeGreaterThan(boardRice.score);
  });

  test('should handle task parameter override when new information is provided', () => {
    const task = manager.createTask('estimate revision test');

    // Initial estimate
    manager.updateTaskParameters(task.id, {
      effort: 4
    });

    expect(manager.getTaskById(task.id)!.parameters.effort).toBe(4);

    // User provides new information: "Actually, it's more like 6 hours"
    manager.updateTaskParameters(task.id, {
      effort: 6
    });

    expect(manager.getTaskById(task.id)!.parameters.effort).toBe(6);
  });

  test('should track conversation state across multiple incomplete tasks', () => {
    // Create multiple tasks with varying completeness
    const task1 = manager.createTask('Task 1');
    const task2 = manager.createTask('Task 2');
    const task3 = manager.createTask('Task 3');

    // Task 1: 1 parameter
    manager.updateTaskParameters(task1.id, { reach: 100 });

    // Task 2: 3 parameters
    manager.updateTaskParameters(task2.id, {
      reach: 200,
      impact: 8,
      confidence: 0.7
    });

    // Task 3: 0 parameters (just created)

    // Priority queue should order by completeness: Task 2, Task 1, Task 3
    const queue = manager.getPriorityQueue();
    expect(queue).toHaveLength(3);
    expect(queue[0].id).toBe(task2.id); // 3/4 parameters
    expect(queue[1].id).toBe(task1.id); // 1/4 parameters
    expect(queue[2].id).toBe(task3.id); // 0/4 parameters

    // State summary should reflect current progress
    const summary = manager.getStateSummary();
    expect(summary).toContain('Active Tasks: 3');
    expect(summary).toContain('Completed Tasks: 0');
    expect(summary).toContain('Task 1 (1/4 parameters)');
    expect(summary).toContain('Task 2 (3/4 parameters)');
    expect(summary).toContain('Task 3 (0/4 parameters)');
  });

  test('should maintain session continuity across conversation', () => {
    const sessionId = manager.getSessionId();

    // Create tasks and update them
    const task1 = manager.createTask('Session test 1');
    const task2 = manager.createTask('Session test 2');

    manager.updateTaskParameters(task1.id, {
      reach: 50,
      impact: 5
    });

    // Session ID should remain consistent
    expect(manager.getSessionId()).toBe(sessionId);

    // State summary should include session info
    const summary = manager.getStateSummary();
    expect(summary).toContain(`Session: ${sessionId}`);
  });

  test('should handle edge case of rapid context switching', () => {
    const taskA = manager.createTask('Task A');
    const taskB = manager.createTask('Task B');
    const taskC = manager.createTask('Task C');

    // Rapid switching: A -> B -> C -> A -> B
    manager.updateTaskParameters(taskA.id, { reach: 100 });
    manager.updateTaskParameters(taskB.id, { reach: 200 });
    manager.updateTaskParameters(taskC.id, { reach: 300 });
    manager.updateTaskParameters(taskA.id, { impact: 5 });
    manager.updateTaskParameters(taskB.id, { impact: 7 });

    // Validate all updates were applied correctly
    expect(manager.getTaskById(taskA.id)!.parameters).toEqual({ reach: 100, impact: 5 });
    expect(manager.getTaskById(taskB.id)!.parameters).toEqual({ reach: 200, impact: 7 });
    expect(manager.getTaskById(taskC.id)!.parameters).toEqual({ reach: 300 });

    // Missing parameters should be tracked correctly
    expect(manager.getMissingParameters(taskA.id)).toEqual(['confidence', 'effort']);
    expect(manager.getMissingParameters(taskB.id)).toEqual(['confidence', 'effort']);
    expect(manager.getMissingParameters(taskC.id)).toEqual(['impact', 'confidence', 'effort']);
  });
});