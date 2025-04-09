// src/game/scenes/MainMenu.ts
import { Scene } from "phaser";

export class MainMenu extends Scene {
    constructor() {
        super("MainMenu");
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        this.add.image(centerX, centerY, "background_generated");

        // Title - Use Luckiest Guy variable
        this.add
            .text(centerX, centerY - 150, "Pollination Fun!", {
                fontFamily: "var(--font-luckiest-guy)", // Use CSS variable
                fontSize: "60px", // Even larger title
                color: "#ffff00",
                stroke: "#8B4513", // SaddleBrown stroke
                strokeThickness: 10, // Thicker stroke
                shadow: {
                    offsetX: 4,
                    offsetY: 4,
                    color: "#4d2607",
                    blur: 6,
                    stroke: true,
                    fill: true,
                },
            })
            .setOrigin(0.5);

        // Instructions - Use Poppins variable
        const instructionBg = this.add
            .rectangle(centerX, centerY - 15, 550, 110, 0x000000, 0.65)
            .setOrigin(0.5);
        this.add
            .text(
                centerX,
                centerY - 15,
                "Use Arrow Keys (or D-Pad on mobile)\nto move the Bee. Collect pollen from a\nglowing flower & deliver it to another\nof the SAME color!",
                {
                    fontFamily: "var(--font-poppins)", // Use CSS variable
                    fontSize: "20px", // Slightly smaller for more text
                    color: "#ffffff",
                    align: "center",
                    lineSpacing: 8,
                    wordWrap: { width: instructionBg.width - 30 },
                }
            )
            .setOrigin(0.5);

        // Start Button - Use Poppins variable
        const startButton = this.add
            .text(centerX, centerY + 95, "Start Game", {
                fontFamily: "var(--font-poppins)", // Use CSS variable
                fontSize: "34px",
                font: "bold 34px var(--font-poppins)", // Use bold Poppins
                color: "#ffffff",
                backgroundColor: "#2E8B57", // SeaGreen
                padding: { x: 30, y: 15 }, // Bigger padding
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#111",
                    blur: 2,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Button Hover Effects
        const originalScale = startButton.scale;
        startButton.on("pointerover", () => {
            this.tweens.add({
                targets: startButton,
                scale: originalScale * 1.08,
                duration: 150,
                ease: "Sine.easeInOut",
            });
            startButton.setBackgroundColor("#3CB371"); // MediumSeaGreen
        });
        startButton.on("pointerout", () => {
            this.tweens.add({
                targets: startButton,
                scale: originalScale,
                duration: 150,
                ease: "Sine.easeInOut",
            });
            startButton.setBackgroundColor("#2E8B57"); // Back to SeaGreen
        });

        // Button Click Action
        startButton.on("pointerdown", () => {
            this.tweens.add({
                targets: startButton,
                scale: originalScale * 0.95,
                duration: 80,
                ease: "Sine.easeInOut",
                yoyo: true,
            });
            this.time.delayedCall(100, () => {
                this.scene.start("Game");
            });
        });
    }
}
