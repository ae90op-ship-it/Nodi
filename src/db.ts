import Dexie, { type Table } from 'dexie';
import type { AppNode, CalcTapeData, NoteData, WhiteboardData } from './types';

export class NibrasDatabase extends Dexie {
  nodes!: Table<AppNode, string>;
  calctapes!: Table<CalcTapeData, string>;
  notes!: Table<NoteData, string>;
  whiteboards!: Table<WhiteboardData, string>;

  constructor() {
    super('NibrasDB');
    // Define schema
    this.version(1).stores({
      nodes: 'id, title, type, createdAt, updatedAt',
      calctapes: 'id, updatedAt',
      notes: 'id, updatedAt',
      whiteboards: 'id, updatedAt',
    });
  }
}

export const db = new NibrasDatabase();
