// src/services/FlowerCollectionService.ts
import FLOWERS, { FlowerType } from "../game/data/flowerTypes";
import StorageService, {
    GameProgress,
    SavedFlowerData,
} from "./StorageService"; // Import types

class FlowerCollectionService {
    private flowers: FlowerType[] = [];
    private storageService: typeof StorageService;
    private isInitialized: Promise<void>; // Promise to track initialization
    private resolveInitialized!: () => void; // Resolver for the promise

    constructor() {
        this.storageService = StorageService;
        // Create the promise
        this.isInitialized = new Promise((resolve) => {
            this.resolveInitialized = resolve;
        });
        // Start asynchronous loading
        this.loadCollection();
    }

    // Ensure service is initialized before proceeding
    private async ensureInitialized(): Promise<void> {
        return this.isInitialized;
    }

    // Initialize or load the collection from storage (now async)
    private async loadCollection(): Promise<void> {
        try {
            // Wait for DB to be ready before trying to get progress
            await (this.storageService as any).waitForDB(); // Access private method carefully or expose a ready promise

            // Get the entire game progress object
            const progress = await this.storageService.getProgress();
            const savedCollectionData = progress?.flowerCollectionData;

            // Make a deep copy of the default flower database
            this.flowers = JSON.parse(JSON.stringify(FLOWERS));

            if (savedCollectionData) {
                // Update discovered status based on saved data
                savedCollectionData.forEach((saved) => {
                    const flower = this.flowers.find((f) => f.id === saved.id);
                    if (flower) {
                        flower.discovered = true;
                        flower.collectionCount = saved.count;
                    }
                });
                console.log("Flower collection loaded from storage.");
            } else {
                // No saved data or collection is empty, use default (already set)
                console.log("No saved flower collection found, using default.");
            }
        } catch (e) {
            console.error("Error loading flower collection:", e);
            // Fallback to default state in case of error
            this.flowers = JSON.parse(JSON.stringify(FLOWERS));
        } finally {
            // Signal that initialization is complete
            this.resolveInitialized();
        }
    }

    // Save the current collection to storage (now async)
    private async saveCollection(): Promise<void> {
        await this.ensureInitialized(); // Ensure initial load is complete before saving
        try {
            // Get current progress or create a default if none exists
            let progress = await this.storageService.getProgress();
            if (!progress) {
                progress = { lastPlayed: new Date() }; // Create minimal progress object
            }

            // Prepare the data to save: only discovered flowers
            const discoveredFlowers: SavedFlowerData[] = this.flowers
                .filter((flower) => flower.discovered)
                .map((flower) => ({
                    id: flower.id,
                    count: flower.collectionCount,
                }));

            // Update the flower collection data within the progress object
            progress.flowerCollectionData = discoveredFlowers;

            // Save the updated progress object
            await this.storageService.saveProgress(progress);
            console.log("Flower collection saved.");
        } catch (error) {
            console.error("Error saving flower collection:", error);
        }
    }

    // Get all flowers (including undiscovered)
    async getAllFlowers(): Promise<FlowerType[]> {
        await this.ensureInitialized();
        return this.flowers;
    }

    // Get only discovered flowers
    async getDiscoveredFlowers(): Promise<FlowerType[]> {
        await this.ensureInitialized();
        return this.flowers.filter((flower) => flower.discovered);
    }

    // Get a specific flower by ID
    async getFlower(id: string): Promise<FlowerType | undefined> {
        await this.ensureInitialized();
        return this.flowers.find((flower) => flower.id === id);
    }

    // Discover a new flower or increment collection count if already discovered
    async discoverFlower(id: string): Promise<FlowerType | undefined> {
        await this.ensureInitialized();
        const flower = this.flowers.find((flower) => flower.id === id);

        if (flower) {
            let needsSave = false;
            if (!flower.discovered) {
                flower.discovered = true;
                flower.collectionCount = 1;
                needsSave = true;
            } else {
                flower.collectionCount++;
                needsSave = true; // Count changed, needs saving
            }

            if (needsSave) {
                // Use await here to ensure saving completes before returning
                await this.saveCollection();
            }
            return flower;
        }

        return undefined;
    }

    // Get the total number of discovered flowers
    async getDiscoveredCount(): Promise<number> {
        await this.ensureInitialized();
        return this.flowers.filter((flower) => flower.discovered).length;
    }

    // Get the total number of flowers in the collection
    async getTotalCount(): Promise<number> {
        await this.ensureInitialized();
        return this.flowers.length;
    }

    // Reset the collection to default state (all undiscovered)
    async resetCollection(): Promise<void> {
        await this.ensureInitialized();
        this.flowers = JSON.parse(JSON.stringify(FLOWERS));
        // Save the reset state
        await this.saveCollection();
    }

    // Generate a random flower ID
    async getRandomFlowerId(): Promise<string> {
        await this.ensureInitialized();
        const randomIndex = Math.floor(Math.random() * this.flowers.length);
        return this.flowers[randomIndex].id;
    }
}

// Create a named instance before exporting
const flowerCollectionService = new FlowerCollectionService();

// Export as singleton
export default flowerCollectionService;
