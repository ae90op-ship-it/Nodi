export type AppModule = 'whiteboard' | 'calctape' | 'note' | 'drawing';

export interface AppNode {
  id: string;
  title: string;
  type: AppModule;
  x: number;
  y: number;
  linkedNodeIds: string[];
  edgeLabels?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface TapeLine {
  id: string;
  expression: string;
  result: number | null;
  comment: string;
}

export interface CalcTapeData {
  id: string; // matches node id
  lines: TapeLine[];
  updatedAt: number;
}

export interface NoteData {
  id: string; // matches node id
  content: string;
  updatedAt: number;
}

export interface WhiteboardElement {
  id: string;
  type: 'path' | 'image' | 'text' | 'sticky';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[]; // for paths
  color?: string;
  text?: string;
  src?: string; // for images (base64)
}

export interface WhiteboardData {
  id: string; // matches node id
  elements: WhiteboardElement[];
  updatedAt: number;
}
