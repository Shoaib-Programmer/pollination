// src/game/scenes/MainMenu.ts
import { Scene } from "phaser";
import gsap from "gsap"; // Import GSAP
import EventBus from "../EventBus"; // Import EventBus if needed for settings icon
import storageService from "@/services/StorageService"; // Import storage service

export class MainMenu extends Scene {
    private hasHighScores: boolean = false;
    private isCheckingScores: boolean = false;
    private highScoresButton?: Phaser.GameObjects.Text;

    constructor() {
        super("MainMenu");
    }

    init() {
        // Check if there are high scores when the scene initializes
        this.checkForHighScores();
    }

    async checkForHighScores() {
        this.isCheckingScores = true;
        try {
            const highScores = await storageService.getHighScores(1); // Just check if there's at least one
            this.hasHighScores = highScores.length > 0;
            this.isCheckingScores = false;

            // If high scores button exists, update its visibility
            this.updateHighScoresButtonVisibility();
        } catch (error) {
            console.error("Failed to check for high scores:", error);
            this.isCheckingScores = false;
            this.hasHighScores = false;
        }
    }

    updateHighScoresButtonVisibility() {
        if (this.highScoresButton) {
            if (this.hasHighScores) {
                // If high scores exist, show the button with animation
                if (this.highScoresButton.alpha === 0) {
                    gsap.to(this.highScoresButton, {
                        alpha: 1,
                        scale: 1,
                        duration: 0.4,
                        ease: "back.out(1.7)",
                    });
                }
            } else {
                // If no high scores, hide the button
                if (this.highScoresButton.alpha > 0) {
                    gsap.to(this.highScoresButton, {
                        alpha: 0,
                        scale: 0.8,
                        duration: 0.3,
                        ease: "power1.in",
                    });
                }
            }
        }
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const topRightX = this.cameras.main.width - 40; // Position for gear icon
        const topRightY = 40;

        // Signal scene change through EventBus
        EventBus.emit("scene:changed", "MainMenu");

        // Background - Fade in
        const bg = this.add
            .image(centerX, centerY, "background_generated")
            .setAlpha(0);
        gsap.to(bg, { alpha: 1, duration: 0.7, ease: "power1.inOut" });

        // --- Settings Icon ---
        const settingsIcon = this.add
            .image(topRightX, topRightY, "gear_icon_generated")
            .setOrigin(0.5)
            .setScale(1.5) // Make it slightly larger
            .setAlpha(0)
            .setInteractive({ useHandCursor: true });

        // --- Animate UI Elements In ---
        const title = this.add
            .text(centerX, centerY - 150, "Pollination Fun!", {
                fontFamily: "var(--font-luckiest-guy)",
                fontSize: "60px",
                color: "#ffff00",
                stroke: "#8B4513",
                strokeThickness: 10,
                shadow: {
                    offsetX: 4,
                    offsetY: 4,
                    color: "#4d2607",
                    blur: 6,
                    stroke: true,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.5); // Start invisible and small

        const instructionBg = this.add
            .rectangle(centerX, centerY - 45, 550, 110, 0x000000, 0.65)
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.8); // Start invisible and smaller
        const instructions = this.add
            .text(
                centerX,
                centerY - 45,
                "Use Arrow Keys (or D-Pad on mobile)\nto move the Bee. Collect pollen from a\nglowing flower & deliver it to another\nof the SAME color!",
                {
                    fontFamily: "var(--font-poppins)",
                    fontSize: "20px",
                    color: "#ffffff",
                    align: "center",
                    lineSpacing: 8,
                    wordWrap: { width: instructionBg.width - 30 },
                },
            )
            .setOrigin(0.5)
            .setAlpha(0); // Start invisible

        const startButton = this.add
            .text(centerX, centerY + 65, "Start Game", {
                font: "bold",
                fontFamily: "var(--font-poppins)",
                fontSize: "34px",
                color: "#ffffff",
                backgroundColor: "#2E8B57",
                padding: { x: 30, y: 15 },
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#111",
                    blur: 2,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setAlpha(0) // Start invisible
            .setScale(0.8); // Start smaller

        // High Scores button - only shown if there are high scores
        this.highScoresButton = this.add
            .text(centerX, centerY + 140, "High Scores", {
                font: "bold",
                fontFamily: "var(--font-poppins)",
                fontSize: "28px",
                color: "#ffffff",
                backgroundColor: "#4682B4", // Steel blue color
                padding: { x: 25, y: 12 },
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#111",
                    blur: 2,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setAlpha(0) // Start invisible
            .setScale(0.8); // Start smaller

        // Flower Collection Button - always visible
        const flowerCollectionButton = this.add
            .text(centerX, centerY + 200, "Flower Collection", {
                font: "bold",
                fontFamily: "var(--font-poppins)",
                fontSize: "28px",
                color: "#ffffff",
                backgroundColor: "#9C27B0", // Purple color
                padding: { x: 25, y: 12 },
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#111",
                    blur: 2,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setAlpha(0) // Start invisible
            .setScale(0.8); // Start smaller

        // GSAP Timeline for staggered entrance
        const tl = gsap.timeline({ delay: 0.3 }); // Start after background fade

        tl.to(title, {
            alpha: 1,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.7)",
        }) // Title pops in
            .to(
                instructionBg,
                { alpha: 0.65, scale: 1, duration: 0.4, ease: "power2.out" },
                "-=0.4",
            ) // Instruction BG fades/scales in
            .to(
                instructions,
                { alpha: 1, duration: 0.4, ease: "power2.out" },
                "-=0.3",
            ) // Instructions fade in
            .to(
                startButton,
                { alpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
                "-=0.2",
            ) // Button pops in
            .to(
                flowerCollectionButton,
                { alpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
                "-=0.3",
            ) // Flower Collection button pops in
            .to(settingsIcon, { alpha: 0.8, duration: 0.4 }, "-=0.3"); // Fade in settings icon

        // Update high scores button visibility based on stored state
        this.updateHighScoresButtonVisibility();

        // --- End Entrance Animation ---

        // --- Settings Icon Interaction ---
        settingsIcon.on("pointerover", () => {
            this.tweens.add({
                targets: settingsIcon,
                angle: 90, // Rotate on hover
                scale: 1.7,
                alpha: 1,
                duration: 200,
                ease: "Sine.easeInOut",
            });
        });
        settingsIcon.on("pointerout", () => {
            this.tweens.add({
                targets: settingsIcon,
                angle: 0,
                scale: 1.5,
                alpha: 0.8,
                duration: 200,
                ease: "Sine.easeInOut",
            });
        });
        settingsIcon.on("pointerdown", () => {
            this.tweens.add({
                targets: settingsIcon,
                scale: 1.4,
                duration: 80,
                ease: "Sine.easeInOut",
                yoyo: true,
            });
            // Transition Out (Fade everything except maybe background)
            gsap.to(
                [
                    title,
                    instructionBg,
                    instructions,
                    startButton,
                    this.highScoresButton,
                    settingsIcon,
                ],
                {
                    alpha: 0,
                    duration: 0.3,
                    ease: "power1.in",
                    onComplete: () => {
                        this.scene.start("Settings"); // Go to Settings scene
                    },
                },
            );
        });

        // Button Hover/Click (Phaser Tweens are fine here)
        startButton.setInteractive({ useHandCursor: true }); // Make interactive AFTER initial animation setup potentially
        const originalScale = 1; // Base scale is 1 after animation
        startButton.on("pointerover", () => {
            this.tweens.killTweensOf(startButton);
            this.tweens.add({
                targets: startButton,
                scale: originalScale * 1.08,
                duration: 150,
                ease: "Sine.easeInOut",
            });
            startButton.setBackgroundColor("#3CB371");
        });
        startButton.on("pointerout", () => {
            this.tweens.killTweensOf(startButton);
            this.tweens.add({
                targets: startButton,
                scale: originalScale,
                duration: 150,
                ease: "Sine.easeInOut",
            });
            startButton.setBackgroundColor("#2E8B57");
        });
        startButton.on("pointerdown", () => {
            this.tweens.killTweensOf(startButton);
            this.tweens.add({
                targets: startButton,
                scale: originalScale * 0.95,
                duration: 80,
                ease: "Sine.easeInOut",
                yoyo: true,
            });
            // Transition Out Animation (Optional)
            gsap.to(
                [
                    title,
                    instructionBg,
                    instructions,
                    startButton,
                    this.highScoresButton,
                    settingsIcon,
                ],
                {
                    alpha: 0,
                    y: "-=30", // Move up slightly
                    duration: 0.3,
                    stagger: 0.1,
                    ease: "power1.in",
                    onComplete: () => {
                        this.scene.start("Game");
                    },
                },
            );
        });

        // High Scores button interaction
        if (this.highScoresButton) {
            this.highScoresButton.setInteractive({ useHandCursor: true });

            this.highScoresButton.on("pointerover", () => {
                this.tweens.killTweensOf(this.highScoresButton!);
                this.tweens.add({
                    targets: this.highScoresButton!,
                    scale: originalScale * 1.08,
                    duration: 150,
                    ease: "Sine.easeInOut",
                });
                this.highScoresButton!.setBackgroundColor("#5A9BDC"); // Lighter blue
            });

            this.highScoresButton.on("pointerout", () => {
                this.tweens.killTweensOf(this.highScoresButton!);
                this.tweens.add({
                    targets: this.highScoresButton!,
                    scale: originalScale,
                    duration: 150,
                    ease: "Sine.easeInOut",
                });
                this.highScoresButton!.setBackgroundColor("#4682B4");
            });

            this.highScoresButton.on("pointerdown", () => {
                this.tweens.killTweensOf(this.highScoresButton!);
                this.tweens.add({
                    targets: this.highScoresButton!,
                    scale: originalScale * 0.95,
                    duration: 80,
                    ease: "Sine.easeInOut",
                    yoyo: true,
                });

                // Go directly to the GameOver scene which shows high scores
                gsap.to(
                    [
                        title,
                        instructionBg,
                        instructions,
                        startButton,
                        this.highScoresButton,
                        settingsIcon,
                    ],
                    {
                        alpha: 0,
                        y: "-=30",
                        duration: 0.3,
                        stagger: 0.1,
                        ease: "power1.in",
                        onComplete: () => {
                            // Pass 0 score to just show high scores without current game score emphasis
                            this.scene.start("GameOver", {
                                score: 0,
                                showHighScoresOnly: true,
                            });
                        },
                    },
                );
            });
        }

        // Flower Collection button interaction
        flowerCollectionButton.setInteractive({ useHandCursor: true });

        flowerCollectionButton.on("pointerover", () => {
            this.tweens.add({
                targets: flowerCollectionButton,
                scale: originalScale * 1.08,
                duration: 150,
                ease: "Sine.easeInOut",
            });
            flowerCollectionButton.setBackgroundColor("#B039C8"); // Lighter purple
        });

        flowerCollectionButton.on("pointerout", () => {
            this.tweens.add({
                targets: flowerCollectionButton,
                scale: originalScale,
                duration: 150,
                ease: "Sine.easeInOut",
            });
            flowerCollectionButton.setBackgroundColor("#9C27B0"); // Original purple
        });

        flowerCollectionButton.on("pointerdown", () => {
            this.tweens.add({
                targets: flowerCollectionButton,
                scale: originalScale * 0.95,
                duration: 80,
                ease: "Sine.easeInOut",
                yoyo: true,
            });

            // Transition to Flower Collection scene
            gsap.to(
                [
                    title,
                    instructionBg,
                    instructions,
                    startButton,
                    this.highScoresButton,
                    flowerCollectionButton,
                    settingsIcon,
                ],
                {
                    alpha: 0,
                    y: "-=30",
                    duration: 0.3,
                    stagger: 0.05,
                    ease: "power1.in",
                    onComplete: () => {
                        this.scene.start("FlowerCollection");
                    },
                },
            );
        });

        // Emit scene readiness for potential future use by PhaserGame bridge
        this.events.emit("scene-ready", this);
    }
}
