// src/game/scenes/MainMenu.ts
import { Scene } from "phaser";
import gsap from "gsap"; // Import GSAP
import EventBus from "../EventBus"; // Import EventBus if needed for settings icon
import storageService from "@/services/StorageService"; // Import storage service
import { createStyledText, addButtonInteractions } from "../utils/ui"; // Import UI utilities
import { createTransitionOut } from "../utils/animation"; // Import animation utilities
import { COMMON_EVENTS } from "../utils/eventUtils"; // Import event constants

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
            // If high scores exist AND button is currently hidden, show it
            if (this.hasHighScores && this.highScoresButton.alpha === 0) {
                gsap.to(this.highScoresButton, {
                    alpha: 1,
                    scale: 1,
                    duration: 0.4,
                    ease: "back.out(1.7)",
                });
            }
            // If no high scores AND button is currently visible, hide it
            else if (!this.hasHighScores && this.highScoresButton.alpha > 0) {
                gsap.to(this.highScoresButton, {
                    alpha: 0,
                    scale: 0.8,
                    duration: 0.3,
                    ease: "power1.in",
                });
            }
        }
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const topRightX = this.cameras.main.width - 40; // Position for gear icon
        const topRightY = 40;

        // Signal scene change through EventBus
        EventBus.emit(COMMON_EVENTS.SCENE_CHANGED, "MainMenu");

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

        const startButton = createStyledText(this, centerX, centerY + 65, "Start Game", "subtitle");
        startButton.setFontSize("34px");
        startButton.setBackgroundColor("#2E8B57");
        startButton.setPadding(30, 15);
        startButton.setAlpha(0); // Start invisible
        startButton.setScale(0.8); // Start smaller

        // High Scores button - only shown if there are high scores
        this.highScoresButton = createStyledText(this, centerX, centerY + 140, "High Scores", "body");
        this.highScoresButton.setFontSize("28px");
        this.highScoresButton.setBackgroundColor("#4682B4"); // Steel blue color
        this.highScoresButton.setPadding(25, 12);
        this.highScoresButton.setAlpha(0); // Start invisible
        this.highScoresButton.setScale(0.8); // Start smaller

        // Flower Collection Button - always visible
        const flowerCollectionButton = createStyledText(this, centerX, centerY + 200, "Flower Collection", "body");
        flowerCollectionButton.setFontSize("28px");
        flowerCollectionButton.setBackgroundColor("#9C27B0"); // Purple color
        flowerCollectionButton.setPadding(25, 12);
        flowerCollectionButton.setAlpha(0); // Start invisible
        flowerCollectionButton.setScale(0.8); // Start smaller

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

        // Add button interactions using utility
        addButtonInteractions(startButton, this, {
            onHover: () => startButton.setBackgroundColor("#3CB371"),
            onOut: () => startButton.setBackgroundColor("#2E8B57"),
            onClick: () => {
                // Transition Out Animation
                createTransitionOut(this, [
                    title,
                    instructionBg,
                    instructions,
                    startButton,
                    this.highScoresButton,
                    settingsIcon,
                ], () => {
                    this.scene.start("Game");
                });
            },
        });

        // High Scores button interaction
        if (this.highScoresButton) {
            addButtonInteractions(this.highScoresButton, this, {
                onHover: () => this.highScoresButton!.setBackgroundColor("#5A9BDC"), // Lighter blue
                onOut: () => this.highScoresButton!.setBackgroundColor("#4682B4"),
                onClick: () => {
                    // Go directly to the GameOver scene which shows high scores
                    createTransitionOut(this, [
                        title,
                        instructionBg,
                        instructions,
                        startButton,
                        this.highScoresButton,
                        settingsIcon,
                    ], () => {
                        // Pass 0 score to just show high scores without current game score emphasis
                        this.scene.start("GameOver", {
                            score: 0,
                            showHighScoresOnly: true,
                        });
                    });
                },
            });
        }

        // Flower Collection button interaction
        addButtonInteractions(flowerCollectionButton, this, {
            onHover: () => flowerCollectionButton.setBackgroundColor("#B039C8"), // Lighter purple
            onOut: () => flowerCollectionButton.setBackgroundColor("#9C27B0"), // Original purple
            onClick: () => {
                // Transition to Flower Collection scene
                createTransitionOut(this, [
                    title,
                    instructionBg,
                    instructions,
                    startButton,
                    this.highScoresButton,
                    flowerCollectionButton,
                    settingsIcon,
                ], () => {
                    this.scene.start("FlowerCollection");
                });
            },
        });

        // Emit scene readiness for potential future use by PhaserGame bridge
        this.events.emit("scene-ready", this);
    }
}
