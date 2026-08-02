export type AppModule = 'whiteboard' | 'calctape' | 'note' | 'drawing' | 'photo_editor' | 'spreadsheet' | 'quick_note' | 'group';

export interface AppNode {
  id: string;
  title: string;
  type: AppModule;
  x: number;
  y: number;
  linkedNodeIds: string[];
  edgeLabels?: Record<string, string>;
  color?: string;
  isLocked?: boolean;
  isPinned?: boolean;
  content?: string; // For quick_note
  parentId?: string; // For grouping
  collapsed?: boolean;
  width?: number;
  height?: number;
  tags?: string[];
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

export interface SpreadsheetCell {
  value: string;
  isBold?: boolean;
  isItalic?: boolean;
  color?: string;
}

export interface SpreadsheetData {
  id: string; // matches node id
  cells: Record<string, SpreadsheetCell>; // e.g. "A1": {value: "10"}
  updatedAt: number;
}

export interface PhotoData {
  id: string;
  imageUrl?: string; // base64
  filters?: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    grayscale: number;
    hueRotate: number;
    sepia: number;
    invert: number;
  };
  rotation?: number;
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
