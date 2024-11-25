import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PhotoBookData {
  pages: any[];
  title: string;
  coverPhoto?: string;
}

interface PhotoBookDB extends DBSchema {
  photobooks: {
    key: string;
    value: PhotoBookData;
  };
}

class StorageService {
  private db: IDBPDatabase<PhotoBookDB> | null = null;
  
  async init() {
    if (this.db) return;

    this.db = await openDB<PhotoBookDB>('photobook-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('photobooks')) {
          db.createObjectStore('photobooks');
        }
      },
    });
  }

  async savePhotoBook(data: PhotoBookData): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.put('photobooks', data, 'current');
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
      throw error;
    }
  }

  async loadPhotoBook(): Promise<PhotoBookData | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      return await this.db.get('photobooks', 'current');
    } catch (error) {
      console.error('Error loading from IndexedDB:', error);
      throw error;
    }
  }

  async clearStorage(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.delete('photobooks', 'current');
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();