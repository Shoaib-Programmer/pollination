// src/game/scenes/GameOver.ts
import { Scene } from "phaser";
import gsap from "gsap"; // Import GSAP
import storageService, { GameScore } from "@/services/StorageService";
import { QuizService } from "@/game/data/quizData";
import EventBus from "@/game/EventBus";

export class GameOver extends Scene {
    private score: number = 0;
    private completedFlowers: number = 0;
    private totalTime: number = 60;
    private highScores: GameScore[] = [];
    private isLoadingScores: boolean = false;
    private showHighScoresOnly: boolean = false;
    private quizService: QuizService;

    constructor() {
        super("GameOver");
        this.quizService = QuizService.getInstance();
    }

    init(data: {
        score?: number;
        completedFlowers?: number;
        totalTime?: number;
        showHighScoresOnly?: boolean;
    }) {
        this.score = data.score ?? 0;
        this.completedFlowers = data.completedFlowers ?? 0;
        this.totalTime = data.totalTime ?? 60;

        // Check if we're just viewing high scores from the main menu
        this.showHighScoresOnly = data.showHighScoresOnly ?? false;

        // Only save the score and increment games played if it's from an actual game (not just viewing high scores)
        if (!this.showHighScoresOnly && this.score > 0) {
            this.saveGameScore();

            // Record that a game has been played in QuizService
            this.quizService.recordGamePlayed();

            // Check if a quiz is due (3+ games played since last quiz)
            if (this.quizService.isQuizDue()) {
                // Update the event name to match what App.tsx is listening for
                EventBus.emit("quiz-requested", true);
            }
        }

        // Always load high scores
        this.loadHighScores();
    }

    async saveGameScore() {
        try {
            await storageService.saveScore({
                score: this.score,
                date: new Date(),
                completedFlowers: this.completedFlowers,
                totalTime: this.totalTime,
            });
            console.log("Score saved successfully");
        } catch (error) {
            console.error("Failed to save score:", error);
        }
    }

    async loadHighScores() {
        this.isLoadingScores = true;
        try {
            this.highScores = await storageService.getHighScores(5);
            this.isLoadingScores = false;

            // If high scores loaded after scene is already created, update the display
            if (this.children.length > 0) {
                this.updateHighScoresDisplay();
            }
        } catch (error) {
            console.error("Failed to load high scores:", error);
            this.isLoadingScores = false;
        }
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
            .text(
                centerX,
                centerY - 160,
                this.showHighScoresOnly
                    ? "High Scores"
                    : "Pollination Complete!",
                {
                    fontFamily: "var(--font-luckiest-guy)",
                    fontSize: this.showHighScoresOnly ? "60px" : "54px",
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
                },
            )
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.5); // Start hidden/small

        // Only show score text if not viewing high scores only
        const scoreText = !this.showHighScoresOnly
            ? this.add
                  .text(centerX, centerY - 80, `Final Score: ${this.score}`, {
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
                  .setScale(0.8) // Start hidden/smaller
            : null;

        // High Scores Panel - Adjust position if showing high scores only
        const highScoresPanel = this.add
            .rectangle(
                centerX,
                this.showHighScoresOnly ? centerY + 20 : centerY + 40,
                500,
                this.showHighScoresOnly ? 260 : 180,
                0x000000,
                0.7,
            )
            .setOrigin(0.5)
            .setAlpha(0);

        // High Scores Title - Only show if not viewing high scores only (to avoid duplication)
        const highScoresTitle = !this.showHighScoresOnly
            ? this.add
                  .text(centerX, centerY - 30, "High Scores", {
                      fontFamily: "var(--font-poppins)",
                      fontSize: "26px",
                      color: "#ffdd00",
                      align: "center",
                  })
                  .setOrigin(0.5)
                  .setAlpha(0)
            : null;

        // High Scores List (will be populated later) - Adjust position if showing high scores only
        const highScoresList = this.add
            .text(
                centerX,
                this.showHighScoresOnly ? centerY + 20 : centerY + 40,
                this.isLoadingScores ? "Loading scores..." : "",
                {
                    fontFamily: "var(--font-poppins)",
                    fontSize: this.showHighScoresOnly ? "24px" : "20px",
                    color: "#ffffff",
                    align: "center",
                    lineSpacing: 12,
                },
            )
            .setOrigin(0.5)
            .setAlpha(0);

        // Adjust button text based on context
        const playAgainButton = this.add
            .text(
                centerX,
                this.showHighScoresOnly ? centerY + 170 : centerY + 170,
                this.showHighScoresOnly ? "Back to Menu" : "Play Again?",
                {
                    fontFamily: "var(--font-poppins)",
                    fontSize: "30px",
                    font: "bold",
                    color: "#ffffff",
                    backgroundColor: this.showHighScoresOnly
                        ? "#4682B4"
                        : "#2E8B57", // Different color for back button
                    padding: { x: 25, y: 12 },
                    shadow: {
                        offsetX: 2,
                        offsetY: 2,
                        color: "#111",
                        blur: 2,
                        fill: true,
                    },
                },
            )
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.8); // Start hidden/smaller

        // GSAP Timeline for staggered entrance - Adjust for high scores only view
        const tl = gsap.timeline({ delay: 0.3 }); // Start after background fade

        // Add elements to timeline conditionally
        tl.to(title, {
            alpha: 1,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.7)",
        });

        // Only add score text animation if it exists
        if (scoreText) {
            tl.to(
                scoreText,
                { alpha: 1, scale: 1, duration: 0.5, ease: "power2.out" },
                "-=0.3",
            );
        }

        tl.to(
            highScoresPanel,
            { alpha: 1, duration: 0.5, ease: "power2.out" },
            "-=0.2",
        );

        // Only add high scores title animation if it exists
        if (highScoresTitle) {
            tl.to(
                highScoresTitle,
                { alpha: 1, duration: 0.5, ease: "power2.out" },
                "-=0.3",
            );
        }

        tl.to(
            highScoresList,
            { alpha: 1, duration: 0.5, ease: "power2.out" },
            "-=0.3",
        ).to(
            playAgainButton,
            { alpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
            "-=0.2",
        );

        // --- End Entrance Animation ---

        // Update high scores display if they're already loaded
        if (!this.isLoadingScores) {
            this.updateHighScoresDisplay(highScoresList);
        }

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
            playAgainButton.setBackgroundColor(
                this.showHighScoresOnly ? "#5A9BDC" : "#3CB371",
            );
        });
        playAgainButton.on("pointerout", () => {
            this.tweens.killTweensOf(playAgainButton);
            this.tweens.add({
                targets: playAgainButton,
                scale: originalScale,
                duration: 100,
                ease: "Sine.easeInOut",
            });
            playAgainButton.setBackgroundColor(
                this.showHighScoresOnly ? "#4682B4" : "#2E8B57",
            );
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

            // Build an array of elements to animate out
            const elementsToAnimate = [
                title,
                highScoresPanel,
                highScoresList,
                playAgainButton,
            ];
            if (scoreText) elementsToAnimate.push(scoreText);
            if (highScoresTitle) elementsToAnimate.push(highScoresTitle);

            // Transition Out
            gsap.to(elementsToAnimate, {
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

        // Store reference to highScoresList for later updates
        this.registry.set("highScoresList", highScoresList);

        // Emit scene readiness
        this.events.emit("scene-ready", this);
    }

    updateHighScoresDisplay(textObject?: Phaser.GameObjects.Text) {
        // Use provided text object or get from registry
        const highScoresList =
            textObject || this.registry.get("highScoresList");
        if (!highScoresList) return;

        if (this.highScores.length === 0) {
            highScoresList.setText(
                "No scores yet.\nBe the first to set a high score!",
            );
            return;
        }

        // Format the high scores
        let scoreText = "";
        this.highScores.forEach((score, index) => {
            const date = new Date(score.date).toLocaleDateString();
            scoreText += `${index + 1}. ${score.score} pts - ${date}\n`;
        });

        highScoresList.setText(scoreText);
    }
}
