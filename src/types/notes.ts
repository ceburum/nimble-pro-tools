// Project Notes - local-first, no cloud dependency
export interface ProjectNote {
  id: string;
  projectId: string;
  title?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}
