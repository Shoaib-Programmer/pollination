// src/game/scenes/Settings.ts
import { Scene } from "phaser";
import gsap from "gsap";
import EventBus from "../EventBus";
import storageService from "@/services/StorageService";

export class Settings extends Scene {
    private musicVolume: number = 5; // Default volume (0-10)
    private soundVolume: number = 7; // Default volume (0-10)
    private difficulty: string = "Easy"; // Default difficulty
    private isLoadingSettings: boolean = false;

    // UI elements that need to be referenced for updates
    private musicVolumeText?: Phaser.GameObjects.Text;
    private soundVolumeText?: Phaser.GameObjects.Text;
    private difficultyText?: Phaser.GameObjects.Text;

    constructor() {
        super("Settings");
    }

    init() {
        // Load settings from IndexedDB when the scene initializes
        this.loadSettings();
    }

    async loadSettings() {
        this.isLoadingSettings = true;
        try {
            const progress = await storageService.getProgress();
            if (progress && progress.settings) {
                // Update local settings from stored values
                this.musicVolume =
                    progress.settings.musicVolume !== undefined
                        ? progress.settings.musicVolume
                        : 5;
                this.soundVolume =
                    progress.settings.soundVolume !== undefined
                        ? progress.settings.soundVolume
                        : 7;
                this.difficulty = progress.settings.difficulty || "Easy";
            }
            this.isLoadingSettings = false;

            // Update UI if it's already created
            this.updateSettingsDisplay();
        } catch (error) {
            console.error("Failed to load settings:", error);
            this.isLoadingSettings = false;
        }
    }

    async saveSettings() {
        try {
            await storageService.saveSettings({
                musicVolume: this.musicVolume,
                soundVolume: this.soundVolume,
                difficulty: this.difficulty,
            });
            console.log("Settings saved successfully");
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    }

    // Updates the UI to display current settings
    updateSettingsDisplay() {
        if (this.musicVolumeText) {
            this.musicVolumeText.setText(
                this.getVolumeBarText("Music Volume:", this.musicVolume)
            );
        }

        if (this.soundVolumeText) {
            this.soundVolumeText.setText(
                this.getVolumeBarText("Sound Effects:", this.soundVolume)
            );
        }

        if (this.difficultyText) {
            this.difficultyText.setText(`Difficulty: ${this.difficulty}`);
        }
    }

    // Helper function to generate a volume bar text
    getVolumeBarText(label: string, value: number): string {
        const maxBars = 10;
        const filledBars = "■".repeat(Math.min(value, maxBars));
        const emptyBars = "□".repeat(Math.max(0, maxBars - value));
        return `${label} ◀ ${filledBars}${emptyBars} ▶`;
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Background
        const bg = this.add
            .image(centerX, centerY, "background_generated")
            .setAlpha(0);
        gsap.to(bg, { alpha: 0.8, duration: 0.7, ease: "power1.inOut" });

        // Title
        const title = this.add
            .text(centerX, centerY - 150, "Settings", {
                fontFamily: "var(--font-luckiest-guy)",
                fontSize: "50px",
                color: "#ffffff",
                stroke: "#333333",
                strokeThickness: 8,
                shadow: {
                    offsetX: 3,
                    offsetY: 3,
                    color: "#111",
                    blur: 4,
                    stroke: true,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.5);

        // Settings content
        const settingsBox = this.add
            .rectangle(centerX, centerY, 500, 220, 0x000000, 0.7)
            .setOrigin(0.5)
            .setAlpha(0);

        // Music Volume setting with left/right controls
        this.musicVolumeText = this.add
            .text(
                centerX,
                centerY - 50,
                this.getVolumeBarText("Music Volume:", this.musicVolume),
                {
                    fontFamily: "var(--font-poppins)",
                    fontSize: "24px",
                    color: "#ffffff",
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setAlpha(0);

        // Sound Effects volume with left/right controls
        this.soundVolumeText = this.add
            .text(
                centerX,
                centerY,
                this.getVolumeBarText("Sound Effects:", this.soundVolume),
                {
                    fontFamily: "var(--font-poppins)",
                    fontSize: "24px",
                    color: "#ffffff",
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setAlpha(0);

        // Difficulty setting with toggle
        this.difficultyText = this.add
            .text(centerX, centerY + 50, `Difficulty: ${this.difficulty}`, {
                fontFamily: "var(--font-poppins)",
                fontSize: "24px",
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5)
            .setAlpha(0);

        // Make settings interactive
        this.makeSettingInteractive(this.musicVolumeText, "music");
        this.makeSettingInteractive(this.soundVolumeText, "sound");
        this.makeSettingInteractive(this.difficultyText, "difficulty");

        // Back button
        const backButton = this.add
            .text(centerX, centerY + 150, "Back to Menu", {
                fontFamily: "var(--font-poppins)",
                fontSize: "28px",
                color: "#ffffff",
                backgroundColor: "#4682B4", // Steel Blue
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
            .setAlpha(0)
            .setScale(0.8);

        // Animation timeline for staggered entrance
        const tl = gsap.timeline({ delay: 0.2 });
        tl.to(title, { alpha: 1, scale: 1, duration: 0.5, ease: "back.out" })
            .to(
                settingsBox,
                { alpha: 1, scale: 1, duration: 0.4, ease: "power1.inOut" },
                "-=0.2"
            )
            .to(
                [
                    this.musicVolumeText,
                    this.soundVolumeText,
                    this.difficultyText,
                ],
                { alpha: 1, duration: 0.4, stagger: 0.1, ease: "power1.inOut" },
                "-=0.2"
            )
            .to(
                backButton,
                { alpha: 1, scale: 1, duration: 0.4, ease: "back.out" },
                "-=0.2"
            );

        // Update settings display with current values
        this.updateSettingsDisplay();

        // Button interaction
        backButton.setInteractive({ useHandCursor: true });
        const originalScale = 1;
        backButton.on("pointerover", () => {
            this.tweens.add({
                targets: backButton,
                scale: originalScale * 1.08,
                duration: 100,
                ease: "Sine.easeInOut",
            });
            backButton.setBackgroundColor("#5A9BDC"); // Lighter blue
        });
        backButton.on("pointerout", () => {
            this.tweens.add({
                targets: backButton,
                scale: originalScale,
                duration: 100,
                ease: "Sine.easeInOut",
            });
            backButton.setBackgroundColor("#4682B4");
        });
        backButton.on("pointerdown", () => {
            this.tweens.add({
                targets: backButton,
                scale: originalScale * 0.95,
                duration: 80,
                ease: "Sine.easeInOut",
                yoyo: true,
            });

            // Save settings before transition
            this.saveSettings();

            // Transition Out
            gsap.to(
                [
                    title,
                    settingsBox,
                    this.musicVolumeText,
                    this.soundVolumeText,
                    this.difficultyText,
                    backButton,
                ],
                {
                    alpha: 0,
                    y: "-=20",
                    duration: 0.3,
                    stagger: 0.05,
                    ease: "power1.in",
                    onComplete: () => {
                        this.scene.start("MainMenu");
                    },
                }
            );
        });

        // Emit scene readiness
        this.events.emit("scene-ready", this);
    }

    // Makes a settings text interactive for adjustment
    makeSettingInteractive(
        textObject: Phaser.GameObjects.Text | undefined,
        type: "music" | "sound" | "difficulty"
    ) {
        if (!textObject) return;

        // Make the text interactive
        textObject.setInteractive({ useHandCursor: true });

        // On hover effect
        textObject.on("pointerover", () => {
            textObject.setTint(0xffff00);
        });

        textObject.on("pointerout", () => {
            textObject.clearTint();
        });

        // Click handler for different setting types
        textObject.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            // Determine if left or right side was clicked
            const isLeftSide = pointer.x < textObject.x;

            // Different behavior based on setting type
            if (type === "music") {
                if (isLeftSide && this.musicVolume > 0) {
                    this.musicVolume--;
                } else if (!isLeftSide && this.musicVolume < 10) {
                    this.musicVolume++;
                }
                // Update music volume in game (would connect to audio manager)
                // this.game.sound.volume = this.musicVolume / 10;
            } else if (type === "sound") {
                if (isLeftSide && this.soundVolume > 0) {
                    this.soundVolume--;
                } else if (!isLeftSide && this.soundVolume < 10) {
                    this.soundVolume++;
                }
                // Update sound effects volume in game
                // this.game.sound.setVolume(this.soundVolume / 10);
            } else if (type === "difficulty") {
                // Cycle through difficulties: Easy -> Medium -> Hard
                if (this.difficulty === "Easy") this.difficulty = "Medium";
                else if (this.difficulty === "Medium") this.difficulty = "Hard";
                else this.difficulty = "Easy";
            }

            // Flash the setting when changed
            this.tweens.add({
                targets: textObject,
                scale: 1.1,
                duration: 100,
                yoyo: true,
                ease: "Sine.easeInOut",
            });

            // Update display to reflect changes
            this.updateSettingsDisplay();
        });
    }
}
