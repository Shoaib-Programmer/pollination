// src/game/scenes/Preloader.ts
import { Scene } from "phaser";
import { BackgroundGenerator } from "@/game/utils/textures/BackgroundGenerator";
import { BeeGenerator } from "@/game/utils/textures/BeeGenerator";
import { FlowerGenerator } from "@/game/utils/textures/FlowerGenerator";
import { PollenGenerator } from "@/game/utils/textures/PollenGenerator";
import { GearGenerator } from "@/game/utils/textures/GearGenerator";

export class Preloader extends Scene {
    // Graphics objects for the loader
    private progressTrack!: Phaser.GameObjects.Graphics;
    private progressBar!: Phaser.GameObjects.Graphics;
    // Text object for percentage
    private percentText!: Phaser.GameObjects.Text;
    // Keep track of the registry update function
    private updateProgressFn: (() => void) | null = null;

    constructor() {
        super("Preloader");
    }

    init() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const loaderRadius = 80; // Radius of the circular loader
        const lineWidth = 8; // Thickness of the loader lines

        // --- Logo (Optional) ---
        if (this.textures.exists("logo")) {
            this.add
                .image(centerX, centerY - loaderRadius - 40, "logo")
                .setOrigin(0.5);
        } else {
            console.warn("Preloader: 'logo' texture not found.");
        }

        // --- Loading Text ---
        const loadingText = this.make
            .text({
                x: centerX,
                y: centerY + loaderRadius + 35, // Position below the loader
                text: "Generating Assets...",
                style: { font: "20px Poppins, sans-serif", color: "#ffffff" },
            })
            .setOrigin(0.5);

        // --- Circular Loader Background (Track) ---
        this.progressTrack = this.add.graphics();
        this.progressTrack.lineStyle(lineWidth, 0x555555, 1); // Grey track
        this.progressTrack.strokeCircle(centerX, centerY, loaderRadius);

        // --- Circular Loader Progress Bar (Filled Arc) ---
        this.progressBar = this.add.graphics();
        // Arc drawing happens in updateProgress

        // --- Percentage Text (Centered) ---
        this.percentText = this.make
            .text({
                x: centerX,
                y: centerY, // Center vertically inside the circle
                text: "0%",
                style: {
                    font: "bold 24px Poppins, sans-serif",
                    color: "#ffffff",
                },
            })
            .setOrigin(0.5);

        // --- Progress Update Logic ---
        let progress = 0;
        const totalGenerations = 6; // background, bee, flower_red, flower_blue, pollen, gear
        this.registry.set("generation_progress_total", totalGenerations);
        this.registry.set("generation_progress_current", 0);

        // Store the update function for use in create()
        this.updateProgressFn = () => {
            const current =
                (this.registry.get("generation_progress_current") || 0) + 1;
            this.registry.set("generation_progress_current", current);
            progress = Math.min(1, current / totalGenerations); // Clamp progress between 0 and 1

            // Update Percentage Text
            this.percentText?.setText(Math.round(progress * 100) + "%");

            // Update Circular Progress Bar
            this.progressBar?.clear();
            this.progressBar?.lineStyle(lineWidth, 0xffffff, 1); // White progress line

            const startAngle = Phaser.Math.DegToRad(-90); // Start at the top
            const endAngle = startAngle + Phaser.Math.PI2 * progress; // Add fraction of full circle
            this.progressBar?.beginPath();
            this.progressBar?.arc(
                centerX,
                centerY,
                loaderRadius,
                startAngle,
                endAngle,
                false,
            ); // false = clockwise
            this.progressBar?.strokePath();
        };

        // Trigger initial draw of 0%
        // Don't increment count yet
        this.percentText?.setText("0%");
        this.progressBar?.clear();
        this.progressBar?.lineStyle(lineWidth, 0xffffff, 1);
        const startAngle = Phaser.Math.DegToRad(-90);
        this.progressBar?.beginPath();
        this.progressBar?.arc(
            centerX,
            centerY,
            loaderRadius,
            startAngle,
            startAngle,
            false,
        ); // Draw 0 length arc initially
        this.progressBar?.strokePath();
    }

    preload() {
        // No assets loaded here in this setup
    }

    create() {
        // console.log("Preloader: Create - Starting texture generation...");
        const updateProgress = this.updateProgressFn; // Use stored function
        
        // Create generators with a common options object
        const generatorOptions = {
            scene: this,
            updateProgress: updateProgress || undefined
        };

        // Generate all textures using our specialized generators
        const backgroundGenerator = new BackgroundGenerator(generatorOptions);
        backgroundGenerator.generate();
        
        const beeGenerator = new BeeGenerator(generatorOptions);
        beeGenerator.generate();
        
        const flowerGenerator = new FlowerGenerator(generatorOptions);
        flowerGenerator.generate();
        
        const pollenGenerator = new PollenGenerator(generatorOptions);
        pollenGenerator.generate();
        
        const gearGenerator = new GearGenerator(generatorOptions);
        gearGenerator.generate();
        
        // Clean up all generators
        backgroundGenerator.destroy();
        beeGenerator.destroy();
        flowerGenerator.destroy();
        pollenGenerator.destroy();
        gearGenerator.destroy();

        // Destroy loader elements explicitly AFTER generation is complete
        // Use a short delay to ensure the final 100% state is visible briefly
        this.time.delayedCall(200, () => {
            // console.log("Preloader: Cleaning up loader visuals.");
            // Find and destroy progress bar related elements created in init()
            this.progressTrack?.destroy();
            this.progressBar?.destroy();
            this.percentText?.destroy();
            // Also destroy logo and loading text if they exist
            const loadingText = this.children.list.find(
                (child) =>
                    child instanceof Phaser.GameObjects.Text &&
                    child.text.includes("Generating"),
            );
            loadingText?.destroy();
            const logoImage = this.children.list.find(
                (child) =>
                    child instanceof Phaser.GameObjects.Image &&
                    child.texture.key === "logo",
            );
            logoImage?.destroy();

            // --- Start Main Menu ---
            // console.log("Preloader: Starting MainMenu scene.");
            this.scene.start("MainMenu");
        });
    }
}
