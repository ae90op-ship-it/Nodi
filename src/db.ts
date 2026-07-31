import Dexie, { type Table } from 'dexie';
import type { AppNode, CalcTapeData, NoteData, WhiteboardData, SpreadsheetData, PhotoData } from './types';

export class NibrasDatabase extends Dexie {
  nodes!: Table<AppNode, string>;
  calctapes!: Table<CalcTapeData, string>;
  notes!: Table<NoteData, string>;
  whiteboards!: Table<WhiteboardData, string>;
  spreadsheets!: Table<SpreadsheetData, string>;
  photos!: Table<PhotoData, string>;

  constructor() {
    super('NibrasDB');
    // Define schema
    this.version(2).stores({
      nodes: 'id, title, type, createdAt, updatedAt',
      calctapes: 'id, updatedAt',
      notes: 'id, updatedAt',
      whiteboards: 'id, updatedAt',
      spreadsheets: 'id, updatedAt',
      photos: 'id, updatedAt',
    });
  }
}

export const db = new NibrasDatabase();
