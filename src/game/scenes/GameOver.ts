// src/game/scenes/GameOver.ts
import { Scene } from "phaser";

export class GameOver extends Scene {
    private score: number = 0;

    constructor() {
        super("GameOver");
    }

    init(data: { score?: number }) {
        this.score = data.score ?? 0;
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        this.add.image(centerX, centerY, "background_generated").setAlpha(0.6);

        // Game Over Title - Use Luckiest Guy variable
        this.add
            .text(centerX, centerY - 110, "Pollination Complete!", {
                fontFamily: "var(--font-luckiest-guy)", // Use CSS variable
                fontSize: "54px", // Adjusted size
                color: "#ffdd00",
                stroke: "#8B4513", // SaddleBrown
                strokeThickness: 9,
                align: "center",
                shadow: {
                    offsetX: 3,
                    offsetY: 3,
                    color: "#4d2607",
                    blur: 5,
                    stroke: true,
                    fill: true,
                },
            })
            .setOrigin(0.5);

        // Display Final Score - Use Poppins variable
        this.add
            .text(centerX, centerY + 10, `Final Score: ${this.score}`, {
                fontFamily: "var(--font-poppins)", // Use CSS variable
                fontSize: "40px", // Larger score
                font: "bold 34px var(--font-poppins)", // Use bold Poppins
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6, // Thicker stroke for visibility
                align: "center",
                shadow: {
                    offsetX: 3,
                    offsetY: 3,
                    color: "#111",
                    blur: 4,
                    fill: true,
                },
            })
            .setOrigin(0.5);

        // Play Again Button - Use Poppins variable
        const playAgainButton = this.add
            .text(centerX, centerY + 110, "Play Again?", {
                fontFamily: "var(--font-poppins)", // Use CSS variable
                fontSize: "30px",
                // fontWeight: "bold",
                font: "bold 34px var(--font-poppins)", // Use bold Poppins
                color: "#ffffff",
                backgroundColor: "#2E8B57", // SeaGreen
                padding: { x: 25, y: 12 }, // Adjusted padding
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
        const originalScale = playAgainButton.scale;
        playAgainButton.on("pointerover", () => {
            this.tweens.add({
                targets: playAgainButton,
                scale: originalScale * 1.08,
                duration: 100,
                ease: "Sine.easeInOut",
            });
            playAgainButton.setBackgroundColor("#3CB371");
        });
        playAgainButton.on("pointerout", () => {
            this.tweens.add({
                targets: playAgainButton,
                scale: originalScale,
                duration: 100,
                ease: "Sine.easeInOut",
            });
            playAgainButton.setBackgroundColor("#2E8B57");
        });

        // Button Click Action
        playAgainButton.on("pointerdown", () => {
            this.tweens.add({
                targets: playAgainButton,
                scale: originalScale * 0.95,
                duration: 80,
                ease: "Sine.easeInOut",
                yoyo: true,
            });
            this.time.delayedCall(100, () => {
                this.scene.start("MainMenu");
            });
        });
    }
}

