// storage-service.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { compress, decompress } from 'lz-string';

interface PhotoBookDB extends DBSchema {
  photobooks: {
    key: string;
    value: {
      chunks: string[];
      timestamp: number;
      title: string;
    };
  };
  chunks: {
    key: string;
    value: string;
  };
}

class StorageService {
  private db: IDBPDatabase<PhotoBookDB> | null = null;
  private readonly CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
  private readonly DB_NAME = 'photobook-storage';
  private readonly DB_VERSION = 1;

  async initDB() {
    if (this.db) return this.db;

    this.db = await openDB<PhotoBookDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create stores
        if (!db.objectStoreNames.contains('photobooks')) {
          db.createObjectStore('photobooks');
        }
        if (!db.objectStoreNames.contains('chunks')) {
          db.createObjectStore('chunks');
        }
      },
    });

    return this.db;
  }

  private splitIntoChunks(data: string): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < data.length; i += this.CHUNK_SIZE) {
      chunks.push(data.slice(i, i + this.CHUNK_SIZE));
    }
    return chunks;
  }

  async savePhotoBook(data: any) {
    await this.initDB();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const compressedData = compress(JSON.stringify(data));
      const chunks = this.splitIntoChunks(compressedData);
      const chunkIds = chunks.map((_, index) => `photobook_chunk_${index}`);

      // Save chunks
      const tx = this.db.transaction(['chunks', 'photobooks'], 'readwrite');
      await Promise.all([
        ...chunks.map((chunk, index) => 
          tx.store.put(chunk, chunkIds[index])
        ),
        tx.store.put({
          chunks: chunkIds,
          timestamp: Date.now(),
          title: data.title || 'Untitled'
        }, 'current_photobook'),
        tx.done
      ]);

      return true;
    } catch (error) {
      console.error('Error saving photobook:', error);
      throw error;
    }
  }

  async loadPhotoBook(): Promise<any> {
    await this.initDB();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const photobook = await this.db.get('photobooks', 'current_photobook');
      if (!photobook) return null;

      // Load all chunks
      const chunks = await Promise.all(
        photobook.chunks.map(chunkId => 
          this.db!.get('chunks', chunkId)
        )
      );

      // Combine chunks and decompress
      const compressedData = chunks.join('');
      const decompressedData = decompress(compressedData);
      
      return JSON.parse(decompressedData);
    } catch (error) {
      console.error('Error loading photobook:', error);
      throw error;
    }
  }

  async clearStorage() {
    await this.initDB();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(['chunks', 'photobooks'], 'readwrite');
    await Promise.all([
      tx.objectStore('chunks').clear(),
      tx.objectStore('photobooks').clear(),
      tx.done
    ]);
  }

  async getStorageSize(): Promise<number> {
    await this.initDB();
    if (!this.db) throw new Error('Database not initialized');

    const photobook = await this.db.get('photobooks', 'current_photobook');
    if (!photobook) return 0;

    const chunks = await Promise.all(
      photobook.chunks.map(chunkId => 
        this.db!.get('chunks', chunkId)
      )
    );

    return chunks.reduce((total, chunk) => total + (chunk?.length || 0), 0);
  }
}

export const storageService = new StorageService();