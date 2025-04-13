// src/game/scenes/MainMenu.ts
import { Scene } from "phaser";
import gsap from "gsap"; // Import GSAP
import EventBus from "../EventBus"; // Import EventBus if needed for settings icon

export class MainMenu extends Scene {
    constructor() {
        super("MainMenu");
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const topRightX = this.cameras.main.width - 40; // Position for gear icon
        const topRightY = 40;

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
            .rectangle(centerX, centerY - 15, 550, 110, 0x000000, 0.65)
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.8); // Start invisible and smaller
        const instructions = this.add
            .text(
                centerX,
                centerY - 15,
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
            .text(centerX, centerY + 95, "Start Game", {
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
            .to(settingsIcon, { alpha: 0.8, duration: 0.4 }, "-=0.3"); // Fade in settings icon

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
                [title, instructionBg, instructions, startButton, settingsIcon],
                {
                    alpha: 0,
                    duration: 0.3,
                    ease: "power1.in",
                    onComplete: () => {
                        this.scene.start("Settings"); // Go to Settings scene
                    },
                }
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
            gsap.to([title, instructionBg, instructions, startButton, settingsIcon], {
                alpha: 0,
                y: "-=30", // Move up slightly
                duration: 0.3,
                stagger: 0.1,
                ease: "power1.in",
                onComplete: () => {
                    this.scene.start("Game");
                },
            });
        });

        // Emit scene readiness for potential future use by PhaserGame bridge
        this.events.emit("scene-ready", this);
    }
}
