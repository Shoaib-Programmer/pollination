// src/game/scenes/Preloader.ts
import { Scene } from "phaser";

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
                false
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
            false
        ); // Draw 0 length arc initially
        this.progressBar?.strokePath();
    }

    preload() {
        // No assets loaded here in this setup
    }

    create() {
        // console.log("Preloader: Create - Starting texture generation...");
        const updateProgress = this.updateProgressFn; // Use stored function

        const graphics = this.make.graphics(); // Use temporary graphics for generation

        // --- Texture Generation Logic ---

        // 1. Generate Background Texture
        const bgWidth = this.cameras.main.width;
        const bgHeight = this.cameras.main.height;
        graphics.fillStyle(0x228b22, 1);
        graphics.fillRect(0, 0, bgWidth, bgHeight);
        graphics.fillStyle(0x3cb371, 0.4);
        for (let i = 0; i < 2000; i++) {
            const x = Phaser.Math.Between(0, bgWidth);
            const y = Phaser.Math.Between(0, bgHeight);
            const width = Phaser.Math.Between(1, 3);
            const height = Phaser.Math.Between(2, 5);
            graphics.fillRect(x, y, width, height);
        }
        graphics.generateTexture("background_generated", bgWidth, bgHeight);
        graphics.clear();
        if (updateProgress) updateProgress();
        // console.log("Generated: background_generated");

        // 2. Generate Bee Texture
        const beeSize = 32;
        const beeBodyY = beeSize / 2;
        const beeBodyWidth = beeSize * 0.6;
        const beeBodyHeight = beeSize * 0.45;
        const headRadius = beeSize * 0.2;
        const wingWidth = beeSize * 0.25;
        graphics.fillStyle(0xffd700, 1);
        graphics.fillEllipse(
            beeSize / 2,
            beeBodyY,
            beeBodyWidth,
            beeBodyHeight
        );
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(
            beeSize / 2 - beeBodyWidth * 0.3,
            beeBodyY - beeBodyHeight / 2,
            beeBodyWidth * 0.2,
            beeBodyHeight
        );
        graphics.fillRect(
            beeSize / 2 + beeBodyWidth * 0.1,
            beeBodyY - beeBodyHeight / 2,
            beeBodyWidth * 0.2,
            beeBodyHeight
        );
        graphics.fillCircle(
            beeSize / 2 + beeBodyWidth / 2 - headRadius * 0.3,
            beeBodyY,
            headRadius
        );
        graphics.fillStyle(0xadd8e6, 0.7);
        graphics
            .slice(
                beeSize / 2 - wingWidth * 0.4,
                beeBodyY - beeBodyHeight * 0.3,
                wingWidth,
                Phaser.Math.DegToRad(180),
                Phaser.Math.DegToRad(340),
                false
            )
            .fillPath();
        graphics
            .slice(
                beeSize / 2 - wingWidth * 0.4,
                beeBodyY + beeBodyHeight * 0.3,
                wingWidth,
                Phaser.Math.DegToRad(20),
                Phaser.Math.DegToRad(180),
                false
            )
            .fillPath();
        graphics.generateTexture("bee_generated", beeSize, beeSize);
        graphics.clear();
        if (updateProgress) updateProgress();
        // console.log("Generated: bee_generated");

        // 3. Generate Flower Textures (Rolled back to original method)
        const flowerSize = 48;
        const petalRadius = flowerSize * 0.35;
        const centerRadius = flowerSize * 0.15;
        const numPetals = 6;

        const drawFlower = (key: string, petalColor: number) => {
            graphics.fillStyle(0xffd700, 1); // Center color
            graphics.fillCircle(flowerSize / 2, flowerSize / 2, centerRadius);
            graphics.lineStyle(1, 0x333333, 0.8); // Center outline
            graphics.strokeCircle(flowerSize / 2, flowerSize / 2, centerRadius);
            graphics.fillStyle(petalColor, 1); // Petal color
            graphics.lineStyle(1, 0x000000, 0.6); // Petal outline

            const numSegments = 16; // Controls smoothness of petal curve

            for (let i = 0; i < numPetals; i++) {
                const angle = Phaser.Math.DegToRad((360 / numPetals) * i);
                const petalDist = petalRadius * 0.95; // Distance from center to petal center
                const petalCenterX =
                    flowerSize / 2 + Math.cos(angle) * petalDist;
                const petalCenterY =
                    flowerSize / 2 + Math.sin(angle) * petalDist;
                // Adjust length/width for more petal-like shape
                const petalLength = petalRadius * 1.3;
                const petalWidth = petalRadius * 0.8;
                const rotationAngle = angle + Math.PI / 2; // Rotate petal to point outwards

                // Draw petal using segmented ellipse approximation
                graphics.beginPath();
                for (let seg = 0; seg <= numSegments; seg++) {
                    const theta = (Math.PI * 2 * seg) / numSegments; // Angle along ellipse
                    // Calculate point on ellipse centered at (0,0)
                    const baseX = (petalLength / 2) * Math.cos(theta);
                    const baseY = (petalWidth / 2) * Math.sin(theta);
                    // Rotate the point
                    const rotatedX =
                        baseX * Math.cos(rotationAngle) -
                        baseY * Math.sin(rotationAngle);
                    const rotatedY =
                        baseX * Math.sin(rotationAngle) +
                        baseY * Math.cos(rotationAngle);
                    // Translate to petal's final position
                    const finalX = petalCenterX + rotatedX;
                    const finalY = petalCenterY + rotatedY;
                    if (seg === 0) graphics.moveTo(finalX, finalY);
                    else graphics.lineTo(finalX, finalY);
                }
                graphics.closePath();
                graphics.fillPath();
                graphics.strokePath();
            }
            graphics.generateTexture(key, flowerSize, flowerSize);
            graphics.clear();
            if (updateProgress) updateProgress(); // Call after each flower type
            // console.log("Generated:", key);
        };

        drawFlower("flower_red_generated", 0xff0000); // Red
        drawFlower("flower_blue_generated", 0x6495ed); // Cornflower Blue

        // 4. Generate Pollen Particle Texture
        const pollenSize = 10;
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(pollenSize / 2, pollenSize / 2, pollenSize * 0.4);
        graphics.generateTexture(
            "pollen_particle_generated",
            pollenSize,
            pollenSize
        );
        graphics.clear();
        if (updateProgress) updateProgress();
        // console.log("Generated: pollen_particle_generated");

        // 5. Generate Gear Icon Texture
        const gearSize = 32;
        const gearRadius = gearSize * 0.4;
        const toothHeight = gearSize * 0.15;
        const toothWidthBase = gearSize * 0.1;
        const toothWidthTop = gearSize * 0.06;
        const numTeeth = 8;
        const holeRadius = gearSize * 0.15;

        graphics.fillStyle(0xc0c0c0, 1); // Silver color
        graphics.lineStyle(1, 0x555555, 1); // Dark grey outline

        // Draw teeth
        for (let i = 0; i < numTeeth; i++) {
            const angle = (Math.PI * 2 * i) / numTeeth;
            const angleMid = (Math.PI * 2 * (i + 0.5)) / numTeeth;

            // Outer points of the tooth
            const x1 =
                gearSize / 2 +
                Math.cos(angle - toothWidthTop / gearRadius) *
                    (gearRadius + toothHeight);
            const y1 =
                gearSize / 2 +
                Math.sin(angle - toothWidthTop / gearRadius) *
                    (gearRadius + toothHeight);
            const x2 =
                gearSize / 2 +
                Math.cos(angle + toothWidthTop / gearRadius) *
                    (gearRadius + toothHeight);
            const y2 =
                gearSize / 2 +
                Math.sin(angle + toothWidthTop / gearRadius) *
                    (gearRadius + toothHeight);

            // Inner points (base of the tooth)
            const x3 =
                gearSize / 2 +
                Math.cos(angleMid - toothWidthBase / gearRadius) * gearRadius;
            const y3 =
                gearSize / 2 +
                Math.sin(angleMid - toothWidthBase / gearRadius) * gearRadius;
            const x4 =
                gearSize / 2 +
                Math.cos(angleMid + toothWidthBase / gearRadius) * gearRadius;
            const y4 =
                gearSize / 2 +
                Math.sin(angleMid + toothWidthBase / gearRadius) * gearRadius;

            graphics.beginPath();
            graphics.moveTo(x3, y3);
            graphics.lineTo(x1, y1);
            graphics.lineTo(x2, y2);
            graphics.lineTo(x4, y4);
            // Implicitly closed by fill/stroke path

            graphics.fillPath();
            graphics.strokePath();
        }

        // Draw main body circle (over teeth bases)
        graphics.fillStyle(0xc0c0c0, 1);
        graphics.fillCircle(gearSize / 2, gearSize / 2, gearRadius);
        graphics.strokeCircle(gearSize / 2, gearSize / 2, gearRadius);

        // Draw center hole
        graphics.fillStyle(0x333333, 1); // Dark hole
        graphics.fillCircle(gearSize / 2, gearSize / 2, holeRadius);
        graphics.strokeCircle(gearSize / 2, gearSize / 2, holeRadius);

        graphics.generateTexture("gear_icon_generated", gearSize, gearSize);
        graphics.clear();
        if (updateProgress) updateProgress();
        // console.log("Generated: gear_icon_generated");

        // --- Cleanup ---
        graphics.destroy(); // Destroy the temporary graphics object
        // console.log("Texture generation complete.");

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
                    child.text.includes("Generating")
            );
            loadingText?.destroy();
            const logoImage = this.children.list.find(
                (child) =>
                    child instanceof Phaser.GameObjects.Image &&
                    child.texture.key === "logo"
            );
            logoImage?.destroy();

            // --- Start Main Menu ---
            // console.log("Preloader: Starting MainMenu scene.");
            this.scene.start("MainMenu");
        });
    }
}
