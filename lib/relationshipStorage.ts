export interface RelationshipProfile {
  tone?: string;
  count?: number;
  notes?: string;
  keywords?: string[];
}

export function getProfile(_customer: string): RelationshipProfile | null { return null; }
export function setProfile(_customer: string, _data: RelationshipProfile): void {}
export function getRelationship(_customer: string): Record<string, unknown> { return {}; }
export function setRelationship(_customer: string, _data: Record<string, unknown>): void {}
