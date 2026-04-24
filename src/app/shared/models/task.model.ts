export type TaskStatus = 'PROGRAMMED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export interface Task {
  id: number;
  title: string;
  description?: string;
  executionDate: string;
  status: TaskStatus;
  items: TaskItem[];
  pendingExecution: boolean;
  dueNowAlert: boolean;
  completedItems: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id?: number;
  description: string;
  completed: boolean | null;
  position?: number;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  executionDate: string;
  status?: TaskStatus;
  items?: TaskItemRequest[];
}

export interface TaskUpdateRequest {
  title: string;
  description?: string;
  executionDate: string;
  status: TaskStatus;
  items?: TaskItemRequest[];
}

export interface TaskItemRequest {
  id?: number;
  description: string;
  completed: boolean;
  position?: number;
}
