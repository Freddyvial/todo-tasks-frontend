import { TaskStatus } from './task.model';

export interface TaskFilter {
  page?: number;
  size?: number;
  query?: string;
  status?: TaskStatus | null;
  pendingOnly?: boolean;
  dueNowOnly?: boolean;
  sort?: string;
}
