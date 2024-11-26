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
      const result = await this.db.get('photobooks', 'current');
      return result || null; // Convert undefined to null
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

  async getStorageSize(): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    try {
      const transaction = this.db.transaction('photobooks', 'readonly');
      const store = transaction.objectStore('photobooks');
      const allData = await store.getAll();
      
      // Calculate the total size of all stored data
      const totalSize = allData.reduce((acc, data) => {
        const jsonData = JSON.stringify(data);
        return acc + new Blob([jsonData]).size;
      }, 0);
      
      return totalSize; // Size in bytes
    } catch (error) {
      console.error('Error calculating storage size:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();