// src/game/scenes/Settings.ts
import { Scene } from "phaser";
import gsap from "gsap";
import EventBus from "../EventBus";

export class Settings extends Scene {
    constructor() {
        super("Settings");
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

        // Settings content (example placeholders)
        const settingsBox = this.add
            .rectangle(centerX, centerY, 500, 220, 0x000000, 0.7)
            .setOrigin(0.5)
            .setAlpha(0);

        const settingsContent = this.add
            .text(
                centerX,
                centerY,
                "Music Volume: ◀ ■■■■■□□□□□ ▶\n\nSound Effects: ◀ ■■■■■■■□□□ ▶\n\nDifficulty: Easy",
                {
                    fontFamily: "var(--font-poppins)",
                    fontSize: "24px",
                    color: "#ffffff",
                    align: "center",
                    lineSpacing: 24,
                },
            )
            .setOrigin(0.5)
            .setAlpha(0);

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
                "-=0.2",
            )
            .to(
                settingsContent,
                { alpha: 1, duration: 0.4, ease: "power1.inOut" },
                "-=0.2",
            )
            .to(
                backButton,
                { alpha: 1, scale: 1, duration: 0.4, ease: "back.out" },
                "-=0.2",
            );

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

            // Transition Out
            gsap.to([title, settingsBox, settingsContent, backButton], {
                alpha: 0,
                y: "-=20",
                duration: 0.3,
                stagger: 0.05,
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
