export interface ActivityItem {
  id: string;
  type: 'message' | 'proposal' | 'report' | 'cardnews' | string;
  customer: string;
  description: string;
  content: string;
  date: string;
  createdAt: string;
  href?: string;
}

export function getActivities(): ActivityItem[] { return []; }
export async function fetchActivitiesFromDB(): Promise<ActivityItem[]> { return []; }
export function addActivity(_item: Omit<ActivityItem, 'id'>): void {}
