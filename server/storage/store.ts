import fs from 'fs';
import path from 'path';

export interface BaseDoc {
  _id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'pos_database.json');

// In-memory collections mirror
class MemoryStore {
  private data: Record<string, BaseDoc[]> = {
    users: [],
    categories: [],
    suppliers: [],
    products: [],
    bills: [],
    returns: [],
    inventoryMovements: [],
    ledgerEntries: [],
    settings: [],
  };

  private initialized = false;

  constructor() {
    this.ensureDirectory();
    this.loadFromFile();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data directory:', err);
      }
    }
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      }
    } catch (err) {
      console.warn('Could not read existing database file, initializing clean store:', err);
    }
    this.initialized = true;
  }

  public saveToFile() {
    try {
      this.ensureDirectory();
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data to file:', err);
    }
  }

  public generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  public getCollection<T extends BaseDoc>(collectionName: string): T[] {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    return this.data[collectionName] as T[];
  }

  public find<T extends BaseDoc>(
    collectionName: string,
    predicate?: (item: T) => boolean
  ): T[] {
    const col = this.getCollection<T>(collectionName);
    if (!predicate) return [...col];
    return col.filter(predicate).map(i => ({ ...i }));
  }

  public findOne<T extends BaseDoc>(
    collectionName: string,
    predicate: (item: T) => boolean
  ): T | null {
    const col = this.getCollection<T>(collectionName);
    const item = col.find(predicate);
    return item ? { ...item } : null;
  }

  public findById<T extends BaseDoc>(collectionName: string, id: string): T | null {
    return this.findOne<T>(collectionName, item => item._id === id || (item as any).id === id);
  }

  public insert<T extends Record<string, any>>(collectionName: string, doc: T): T & BaseDoc {
    const col = this.getCollection(collectionName);
    const now = new Date().toISOString();
    const newDoc: BaseDoc = {
      ...doc,
      _id: doc._id || this.generateId(),
      createdAt: doc.createdAt || now,
      updatedAt: now,
    };
    col.push(newDoc);
    this.saveToFile();
    return { ...newDoc } as T & BaseDoc;
  }

  public updateById<T extends BaseDoc>(
    collectionName: string,
    id: string,
    updates: Partial<T>
  ): T | null {
    const col = this.getCollection<T>(collectionName);
    const index = col.findIndex(item => item._id === id || (item as any).id === id);
    if (index === -1) return null;

    const existing = col[index];
    const updated: T = {
      ...existing,
      ...updates,
      _id: existing._id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    col[index] = updated;
    this.saveToFile();
    return { ...updated };
  }

  public deleteById(collectionName: string, id: string): boolean {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => item._id === id || (item as any).id === id);
    if (index === -1) return false;
    col.splice(index, 1);
    this.saveToFile();
    return true;
  }

  public count(collectionName: string, predicate?: (item: any) => boolean): number {
    const col = this.getCollection(collectionName);
    if (!predicate) return col.length;
    return col.filter(predicate).length;
  }

  public clearAll() {
    for (const key of Object.keys(this.data)) {
      this.data[key] = [];
    }
    this.saveToFile();
  }
}

export const dbStore = new MemoryStore();
