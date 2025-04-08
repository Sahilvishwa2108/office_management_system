import { initScheduledTasks } from '@/lib/scheduled-tasks';

// Only start if we're in a server environment
if (typeof window === 'undefined') {
  initScheduledTasks();
}

export const startupComplete = true;