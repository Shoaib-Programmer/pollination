// src/game/scenes/GameOver.ts
import { Scene } from "phaser";
import gsap from "gsap"; // Import GSAP

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

        // Dimmed Background - Fade in alpha
        const bg = this.add
            .image(centerX, centerY, "background_generated")
            .setAlpha(0);
        gsap.to(bg, { alpha: 0.6, duration: 0.7, ease: "power1.inOut" });

        // --- Animate Elements In ---
        const title = this.add
            .text(centerX, centerY - 110, "Pollination Complete!", {
                fontFamily: "var(--font-luckiest-guy)",
                fontSize: "54px",
                color: "#ffdd00",
                stroke: "#8B4513",
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
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.5); // Start hidden/small

        const scoreText = this.add
            .text(centerX, centerY + 10, `Final Score: ${this.score}`, {
                fontFamily: "var(--font-poppins)",
                fontSize: "40px",
                font: "bold",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6,
                align: "center",
                shadow: {
                    offsetX: 3,
                    offsetY: 3,
                    color: "#111",
                    blur: 4,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.8); // Start hidden/smaller

        const playAgainButton = this.add
            .text(centerX, centerY + 110, "Play Again?", {
                fontFamily: "var(--font-poppins)",
                fontSize: "30px",
                font: "bold",
                color: "#ffffff",
                backgroundColor: "#2E8B57",
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
            .setScale(0.8); // Start hidden/smaller

        // GSAP Timeline for staggered entrance
        const tl = gsap.timeline({ delay: 0.3 }); // Start after background fade

        tl.to(title, {
            alpha: 1,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.7)",
        })
            .to(
                scoreText,
                { alpha: 1, scale: 1, duration: 0.5, ease: "power2.out" },
                "-=0.3"
            )
            .to(
                playAgainButton,
                { alpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
                "-=0.2"
            );

        // --- End Entrance Animation ---

        // Button Interactions (Phaser Tweens remain suitable)
        playAgainButton.setInteractive({ useHandCursor: true });
        const originalScale = 1;
        playAgainButton.on("pointerover", () => {
            this.tweens.killTweensOf(playAgainButton);
            this.tweens.add({
                targets: playAgainButton,
                scale: originalScale * 1.08,
                duration: 100,
                ease: "Sine.easeInOut",
            });
            playAgainButton.setBackgroundColor("#3CB371");
        });
        playAgainButton.on("pointerout", () => {
            this.tweens.killTweensOf(playAgainButton);
            this.tweens.add({
                targets: playAgainButton,
                scale: originalScale,
                duration: 100,
                ease: "Sine.easeInOut",
            });
            playAgainButton.setBackgroundColor("#2E8B57");
        });
        playAgainButton.on("pointerdown", () => {
            this.tweens.killTweensOf(playAgainButton);
            this.tweens.add({
                targets: playAgainButton,
                scale: originalScale * 0.95,
                duration: 80,
                ease: "Sine.easeInOut",
                yoyo: true,
            });
            // Transition Out (Optional)
            gsap.to([title, scoreText, playAgainButton], {
                alpha: 0,
                y: "-=30",
                duration: 0.3,
                stagger: 0.1,
                ease: "power1.in",
                onComplete: () => {
                    this.scene.start("MainMenu");
                },
            });
        });

        // Emit scene readiness
        this.events.emit("scene-ready", this);
    }
}
