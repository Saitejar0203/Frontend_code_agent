export interface BoltAction {
  type: 'file' | 'shell';
  content: string;
  filePath?: string;
  operation?: 'create' | 'update';
}

export interface BoltArtifact {
  id: string;
  title: string;
  actions: BoltAction[];
}

export interface ActionResult {
  success: boolean;
  output?: string;
  error?: string;
}