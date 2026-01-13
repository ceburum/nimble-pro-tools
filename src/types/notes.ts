// Global Notes - with optional project assignment
export interface GlobalNote {
  id: string;
  projectIds: string[]; // Can be assigned to multiple projects, or empty for unassigned
  title?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy type for backwards compatibility
export interface ProjectNote {
  id: string;
  projectId: string;
  title?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}
