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

    const triggerSave = () => {
      window.dispatchEvent(new CustomEvent('dataSaved'));
    };

    this.nodes.hook('creating', triggerSave);
    this.nodes.hook('updating', triggerSave);
    this.calctapes.hook('creating', triggerSave);
    this.calctapes.hook('updating', triggerSave);
    this.notes.hook('creating', triggerSave);
    this.notes.hook('updating', triggerSave);
    this.whiteboards.hook('creating', triggerSave);
    this.whiteboards.hook('updating', triggerSave);
    this.spreadsheets.hook('creating', triggerSave);
    this.spreadsheets.hook('updating', triggerSave);
    this.photos.hook('creating', triggerSave);
    this.photos.hook('updating', triggerSave);
  }
}

export const db = new NibrasDatabase();
