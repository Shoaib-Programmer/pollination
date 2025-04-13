// src/services/StorageService.ts
interface GameScore {
  id?: number;
  score: number;
  date: Date;
  completedFlowers: number;
  totalTime: number;
}

interface GameProgress {
  id?: number;
  currentLevel?: number;
  lastPlayed: Date;
  settings?: {
    musicVolume?: number;
    soundVolume?: number;
    difficulty?: string;
  };
}

class StorageService {
  private readonly DB_NAME = 'pollinationGame';
  private readonly DB_VERSION = 1;
  private readonly SCORES_STORE = 'scores';
  private readonly PROGRESS_STORE = 'progress';
  private db: IDBDatabase | null = null;
  private dbReady: Promise<boolean>;
  private dbReadyResolver!: (value: boolean) => void;

  constructor() {
    // Create a promise that will be resolved when the database is ready
    this.dbReady = new Promise<boolean>((resolve) => {
      this.dbReadyResolver = resolve;
    });
    
    // Initialize the database connection
    this.initDB();
  }

  private initDB(): void {
    if (!window.indexedDB) {
      console.warn('IndexedDB is not supported in this browser');
      this.dbReadyResolver(false);
      return;
    }

    const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      this.dbReadyResolver(false);
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      console.log('IndexedDB connected successfully');
      this.dbReadyResolver(true);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create scores object store
      if (!db.objectStoreNames.contains(this.SCORES_STORE)) {
        const scoresStore = db.createObjectStore(this.SCORES_STORE, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        scoresStore.createIndex('score', 'score', { unique: false });
        scoresStore.createIndex('date', 'date', { unique: false });
      }
      
      // Create progress object store
      if (!db.objectStoreNames.contains(this.PROGRESS_STORE)) {
        db.createObjectStore(this.PROGRESS_STORE, { 
          keyPath: 'id',
          autoIncrement: true 
        });
      }
    };
  }

  // Wait for database to be ready before performing operations
  private async waitForDB(): Promise<boolean> {
    return this.dbReady;
  }

  // Save a new score
  async saveScore(score: GameScore): Promise<number> {
    const isReady = await this.waitForDB();
    if (!isReady || !this.db) {
      console.warn('Database not ready, could not save score');
      return -1;
    }

    return new Promise<number>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.SCORES_STORE], 'readwrite');
        const store = transaction.objectStore(this.SCORES_STORE);
        const request = store.add(score);

        request.onsuccess = () => {
          resolve(request.result as number);
        };

        request.onerror = (event) => {
          console.error('Error saving score:', event);
          reject('Failed to save score');
        };
      } catch (error) {
        console.error('Exception while saving score:', error);
        reject(error);
      }
    });
  }

  // Get high scores (top N scores)
  async getHighScores(limit = 5): Promise<GameScore[]> {
    const isReady = await this.waitForDB();
    if (!isReady || !this.db) {
      console.warn('Database not ready, could not retrieve high scores');
      return [];
    }

    return new Promise<GameScore[]>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.SCORES_STORE], 'readonly');
        const store = transaction.objectStore(this.SCORES_STORE);
        const index = store.index('score');
        const request = index.openCursor(null, 'prev'); // 'prev' for descending order

        const highScores: GameScore[] = [];
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor && highScores.length < limit) {
            highScores.push(cursor.value);
            cursor.continue();
          } else {
            resolve(highScores);
          }
        };

        request.onerror = (event) => {
          console.error('Error getting high scores:', event);
          reject('Failed to get high scores');
        };
      } catch (error) {
        console.error('Exception while getting high scores:', error);
        reject(error);
      }
    });
  }

  // Save game progress
  async saveProgress(progress: GameProgress): Promise<number> {
    const isReady = await this.waitForDB();
    if (!isReady || !this.db) {
      console.warn('Database not ready, could not save progress');
      return -1;
    }

    return new Promise<number>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.PROGRESS_STORE], 'readwrite');
        const store = transaction.objectStore(this.PROGRESS_STORE);
        
        // Always use ID 1 for the single progress record (overwrite existing)
        progress.id = 1;
        const request = store.put(progress);

        request.onsuccess = () => {
          resolve(request.result as number);
        };

        request.onerror = (event) => {
          console.error('Error saving progress:', event);
          reject('Failed to save progress');
        };
      } catch (error) {
        console.error('Exception while saving progress:', error);
        reject(error);
      }
    });
  }

  // Get the latest game progress
  async getProgress(): Promise<GameProgress | null> {
    const isReady = await this.waitForDB();
    if (!isReady || !this.db) {
      console.warn('Database not ready, could not retrieve progress');
      return null;
    }

    return new Promise<GameProgress | null>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.PROGRESS_STORE], 'readonly');
        const store = transaction.objectStore(this.PROGRESS_STORE);
        const request = store.get(1); // Always use ID 1 for the single progress record

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = (event) => {
          console.error('Error getting progress:', event);
          reject('Failed to get progress');
        };
      } catch (error) {
        console.error('Exception while getting progress:', error);
        reject(error);
      }
    });
  }

  // Save settings (part of progress)
  async saveSettings(settings: GameProgress['settings']): Promise<boolean> {
    try {
      // Get existing progress first
      const progress = await this.getProgress() || {
        lastPlayed: new Date(),
        settings: {}
      };
      
      // Update only the settings part
      progress.settings = {
        ...progress.settings,
        ...settings
      };
      progress.lastPlayed = new Date();
      
      // Save the updated progress
      await this.saveProgress(progress);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }
}

// Export a singleton instance
const storageService = new StorageService();
export default storageService;
export type { GameScore, GameProgress };