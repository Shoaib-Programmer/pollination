// src/game/scenes/Preloader.ts
import { Scene } from "phaser";
import { BackgroundGenerator } from "@/game/utils/textures/BackgroundGenerator";
import { BeeGenerator } from "@/game/utils/textures/BeeGenerator";
import { FlowerGenerator } from "@/game/utils/textures/FlowerGenerator";
import { PollenGenerator } from "@/game/utils/textures/PollenGenerator";
import { GearGenerator } from "@/game/utils/textures/GearGenerator";

// --- Constants ---
const SCENE_KEY = "Preloader";
const MAIN_MENU_SCENE_KEY = "MainMenu";
const LOGO_TEXTURE_KEY = "logo";

const REGISTRY_KEYS = {
    TOTAL: "generation_progress_total",
    CURRENT: "generation_progress_current",
};

const LOADER_GEOMETRY = {
    RADIUS: 80,
    LINE_WIDTH: 8,
    LOGO_OFFSET_Y: -40, // Offset above the loader center
    TEXT_OFFSET_Y: 35, // Offset below the loader center
};

const LOADER_STYLE = {
    TRACK_COLOR: 0x555555,
    PROGRESS_COLOR: 0xffffff,
    FONT_LOADING: "20px Poppins, sans-serif",
    FONT_PERCENT: "bold 24px Poppins, sans-serif",
    TEXT_COLOR: "#ffffff",
};

const CLEANUP_DELAY_MS = 200; // Delay before cleaning up UI and changing scene

// --- Generator Definitions ---
// Array of generator constructors to iterate over
const GENERATOR_CONSTRUCTORS = [
    BackgroundGenerator,
    BeeGenerator,
    FlowerGenerator,
    PollenGenerator,
    GearGenerator,
];

// Interface for Generators (assuming they have generate and destroy)
interface ITextureGenerator {
    generate(): void;
    destroy(): void;
}
// Interface for Generator constructor options
interface IGeneratorOptions {
    scene: Scene;
    updateProgress: () => void;
}

export class Preloader extends Scene {
    // UI Elements
    private progressTrack?: Phaser.GameObjects.Graphics;
    private progressBar?: Phaser.GameObjects.Graphics;
    private percentText?: Phaser.GameObjects.Text;
    private loadingText?: Phaser.GameObjects.Text;
    private logoImage?: Phaser.GameObjects.Image;

    // Scene Properties
    private centerX: number = 0;
    private centerY: number = 0;
    private totalGenerations: number = 0;

    constructor() {
        super(SCENE_KEY);
    }

    init() {
        this.centerX = this.cameras.main.width / 2;
        this.centerY = this.cameras.main.height / 2;
        this.totalGenerations = GENERATOR_CONSTRUCTORS.length;

        this.setupRegistry();
        this.createLoaderUI();
        this.updateProgressDisplay(); // Draw initial 0% state
    }

    preload() {
        // No assets are loaded via Phaser's loader in this scene
    }

    create() {
        console.log(`${SCENE_KEY}: Starting texture generation...`);

        const generators: ITextureGenerator[] = [];
        const generatorOptions: IGeneratorOptions = {
            scene: this,
            updateProgress: this.incrementAndProgress.bind(this),
        };

        // 1. Instantiate all generators
        GENERATOR_CONSTRUCTORS.forEach((GeneratorConst) => {
            generators.push(new GeneratorConst(generatorOptions));
        });

        // 2. Run generation process for all generators
        // Assuming generate() calls updateProgress internally and synchronously
        generators.forEach((generator) => {
            try {
                generator.generate();
            } catch (error) {
                console.error(
                    `Error during generation for ${generator.constructor.name}:`,
                    error,
                );
                // Optionally handle error, e.g., stop loading, show error message
            }
        });

        // 3. Destroy all generator instances
        generators.forEach((generator) => {
            generator.destroy();
        });
        console.log(`${SCENE_KEY}: Texture generation complete.`);

        // 4. Schedule cleanup and scene transition
        this.time.delayedCall(CLEANUP_DELAY_MS, () => {
            console.log(`${SCENE_KEY}: Cleaning up loader visuals.`);
            this.cleanupLoaderUI();
            console.log(`${SCENE_KEY}: Starting ${MAIN_MENU_SCENE_KEY} scene.`);
            this.scene.start(MAIN_MENU_SCENE_KEY);
        });
    }

    // --- Private Helper Methods ---

    /**
     * Sets up the initial values in the Phaser Registry for progress tracking.
     */
    private setupRegistry(): void {
        this.registry.set(REGISTRY_KEYS.TOTAL, this.totalGenerations);
        this.registry.set(REGISTRY_KEYS.CURRENT, 0);
    }

    /**
     * Creates all the visual elements for the loader UI.
     */
    private createLoaderUI(): void {
        // --- Logo (Optional) ---
        if (this.textures.exists(LOGO_TEXTURE_KEY)) {
            this.logoImage = this.add
                .image(
                    this.centerX,
                    this.centerY +
                        LOADER_GEOMETRY.RADIUS +
                        LOADER_GEOMETRY.LOGO_OFFSET_Y,
                    LOGO_TEXTURE_KEY,
                )
                .setOrigin(0.5);
        } else {
            console.warn(
                `${SCENE_KEY}: '${LOGO_TEXTURE_KEY}' texture not found. Skipping logo display.`,
            );
        }

        // --- Loading Text ---
        this.loadingText = this.make
            .text({
                x: this.centerX,
                y:
                    this.centerY +
                    LOADER_GEOMETRY.RADIUS +
                    LOADER_GEOMETRY.TEXT_OFFSET_Y,
                text: "Generating Assets...",
                style: {
                    font: LOADER_STYLE.FONT_LOADING,
                    color: LOADER_STYLE.TEXT_COLOR,
                },
            })
            .setOrigin(0.5);

        // --- Circular Loader Background (Track) ---
        this.progressTrack = this.add.graphics();
        this.progressTrack.lineStyle(
            LOADER_GEOMETRY.LINE_WIDTH,
            LOADER_STYLE.TRACK_COLOR,
            1,
        );
        this.progressTrack.strokeCircle(
            this.centerX,
            this.centerY,
            LOADER_GEOMETRY.RADIUS,
        );

        // --- Circular Loader Progress Bar (Filled Arc) ---
        this.progressBar = this.add.graphics();
        // Initial drawing happens in updateProgressDisplay

        // --- Percentage Text (Centered) ---
        this.percentText = this.make
            .text({
                x: this.centerX,
                y: this.centerY,
                text: "0%", // Initial value
                style: {
                    font: LOADER_STYLE.FONT_PERCENT,
                    color: LOADER_STYLE.TEXT_COLOR,
                },
            })
            .setOrigin(0.5);
    }

    /**
     * Increments the progress counter in the registry and updates the display.
     * This function is passed to the generators.
     */
    private incrementAndProgress(): void {
        const current =
            (this.registry.get(REGISTRY_KEYS.CURRENT) || 0) + 1;
        // Ensure current doesn't exceed total (though it shouldn't if called correctly)
        const clampedCurrent = Math.min(current, this.totalGenerations);
        this.registry.set(REGISTRY_KEYS.CURRENT, clampedCurrent);

        this.updateProgressDisplay();
    }

    /**
     * Updates the visual representation of the progress (text and bar).
     * Reads the current progress from the registry.
     */
    private updateProgressDisplay(): void {
        const current = this.registry.get(REGISTRY_KEYS.CURRENT) || 0;
        const total = this.registry.get(REGISTRY_KEYS.TOTAL) || 1; // Avoid division by zero
        const progress = Math.min(1, Math.max(0, current / total)); // Clamp progress [0, 1]

        // Update Percentage Text
        this.percentText?.setText(`${Math.round(progress * 100)}%`);

        // Update Circular Progress Bar
        this.progressBar?.clear();
        if (progress > 0) {
            // Only draw if there's progress
            this.progressBar?.lineStyle(
                LOADER_GEOMETRY.LINE_WIDTH,
                LOADER_STYLE.PROGRESS_COLOR,
                1,
            );

            const startAngle = Phaser.Math.DegToRad(-90); // Start at the top
            const endAngle = startAngle + Phaser.Math.PI2 * progress;

            this.progressBar?.beginPath();
            this.progressBar?.arc(
                this.centerX,
                this.centerY,
                LOADER_GEOMETRY.RADIUS,
                startAngle,
                endAngle,
                false, // Clockwise
            );
            this.progressBar?.strokePath();
        }
    }

    /**
     * Destroys all the UI elements created for the loader.
     */
    private cleanupLoaderUI(): void {
        this.progressTrack?.destroy();
        this.progressBar?.destroy();
        this.percentText?.destroy();
        this.loadingText?.destroy();
        this.logoImage?.destroy();

        // Nullify references to prevent potential memory leaks if scene reused (unlikely here)
        this.progressTrack = undefined;
        this.progressBar = undefined;
        this.percentText = undefined;
        this.loadingText = undefined;
        this.logoImage = undefined;
    }
}