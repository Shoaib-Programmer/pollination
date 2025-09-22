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
        knowledgeNectar?: boolean;
    };
}

class StorageService {
    private readonly DB_NAME = 'pollinationGame';
    private readonly DB_VERSION = 1; // Increment if schema changes (though adding optional field might not strictly require it)
    private readonly SCORES_STORE = 'scores';
    private readonly PROGRESS_STORE = 'progress';
    private db: IDBDatabase | null = null;
    private dbReady: Promise<boolean>;
    private dbReadyResolver!: (value: boolean) => void;

    constructor() {
        this.dbReady = new Promise<boolean>(resolve => {
            this.dbReadyResolver = resolve;
        });
        this.initDB();
    }

    private initDB(): void {
        if (!window.indexedDB) {
            console.warn('IndexedDB is not supported in this browser');
            this.dbReadyResolver(false);
            return;
        }

        const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onerror = event => {
            console.error('IndexedDB error:', event);
            this.dbReadyResolver(false);
        };

        request.onsuccess = event => {
            this.db = (event.target as IDBOpenDBRequest).result;
            console.log('IndexedDB connected successfully');
            this.dbReadyResolver(true);
        };

        request.onupgradeneeded = event => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create scores object store
            if (!db.objectStoreNames.contains(this.SCORES_STORE)) {
                const scoresStore = db.createObjectStore(this.SCORES_STORE, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                scoresStore.createIndex('score', 'score', { unique: false });
                scoresStore.createIndex('date', 'date', { unique: false });
            }

            // Create/update progress object store
            // NOTE: If you change the structure significantly in the future (e.g., add indexes),
            // you might need to delete and recreate the store or handle migrations more carefully.
            if (!db.objectStoreNames.contains(this.PROGRESS_STORE)) {
                db.createObjectStore(this.PROGRESS_STORE, {
                    keyPath: 'id',
                    autoIncrement: true, // Although we only use id=1
                });
            }
            // If the store exists, no action needed here for adding an optional property to the stored object.
        };
    }

    private async waitForDB(): Promise<boolean> {
        return this.dbReady;
    }

    async saveScore(score: GameScore): Promise<number> {
        const isReady = await this.waitForDB();
        if (!isReady || !this.db) {
            console.warn('Database not ready, could not save score');
            return -1;
        }

        return new Promise<number>((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(
                    [this.SCORES_STORE],
                    'readwrite'
                );
                const store = transaction.objectStore(this.SCORES_STORE);
                const request = store.add(score);

                request.onsuccess = () => {
                    resolve(request.result as number);
                };

                request.onerror = event => {
                    console.error('Error saving score:', event);
                    reject(`Failed to save score: ${request.error?.message}`);
                };
            } catch (error) {
                console.error('Exception while saving score:', error);
                reject(error);
            }
        });
    }

    async getHighScores(limit = 5): Promise<GameScore[]> {
        const isReady = await this.waitForDB();
        if (!isReady || !this.db) {
            console.warn('Database not ready, could not retrieve high scores');
            return [];
        }

        return new Promise<GameScore[]>((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(
                    [this.SCORES_STORE],
                    'readonly'
                );
                const store = transaction.objectStore(this.SCORES_STORE);
                const index = store.index('score');
                const request = index.openCursor(null, 'prev');

                const highScores: GameScore[] = [];

                request.onsuccess = event => {
                    const cursor = (
                        event.target as IDBRequest<IDBCursorWithValue>
                    ).result;
                    if (cursor && highScores.length < limit) {
                        highScores.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(highScores);
                    }
                };

                request.onerror = event => {
                    console.error('Error getting high scores:', event);
                    reject(
                        `Failed to get high scores: ${request.error?.message}`
                    );
                };
            } catch (error) {
                console.error('Exception while getting high scores:', error);
                reject(error);
            }
        });
    }

    async saveProgress(progress: GameProgress): Promise<number> {
        const isReady = await this.waitForDB();
        if (!isReady || !this.db) {
            console.warn('Database not ready, could not save progress');
            return -1;
        }

        return new Promise<number>((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(
                    [this.PROGRESS_STORE],
                    'readwrite'
                );
                const store = transaction.objectStore(this.PROGRESS_STORE);

                progress.id = 1; // Always use ID 1 for the single progress record
                progress.lastPlayed = new Date(); // Ensure lastPlayed is updated on every save
                const request = store.put(progress);

                request.onsuccess = () => {
                    resolve(request.result as number);
                };

                request.onerror = event => {
                    console.error('Error saving progress:', event);
                    reject(
                        `Failed to save progress: ${request.error?.message}`
                    );
                };
            } catch (error) {
                console.error('Exception while saving progress:', error);
                reject(error);
            }
        });
    }

    async getProgress(): Promise<GameProgress | null> {
        const isReady = await this.waitForDB();
        if (!isReady || !this.db) {
            console.warn('Database not ready, could not retrieve progress');
            return null;
        }

        return new Promise<GameProgress | null>((resolve, reject) => {
            try {
                const transaction = this.db!.transaction(
                    [this.PROGRESS_STORE],
                    'readonly'
                );
                const store = transaction.objectStore(this.PROGRESS_STORE);
                const request = store.get(1); // Always get ID 1

                request.onsuccess = () => {
                    // Ensure date objects are correctly deserialized if stored as strings (IndexedDB handles Dates)
                    const result = request.result as GameProgress | undefined;
                    resolve(result || null);
                };

                request.onerror = event => {
                    console.error('Error getting progress:', event);
                    reject(`Failed to get progress: ${request.error?.message}`);
                };
            } catch (error) {
                console.error('Exception while getting progress:', error);
                reject(error);
            }
        });
    }

    async saveSettings(settings: GameProgress['settings']): Promise<boolean> {
        try {
            const progress = (await this.getProgress()) || {
                // Provide default structure if no progress exists
                id: 1,
                lastPlayed: new Date(),
                settings: {},
            };

            progress.settings = {
                ...progress.settings,
                ...settings, // Merge new settings
            };
            // lastPlayed is updated automatically in saveProgress

            await this.saveProgress(progress);
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }
}

const storageService = new StorageService();
export default storageService;
export type { GameScore, GameProgress };
