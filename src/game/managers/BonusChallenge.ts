// src/game/managers/BonusChallenge.ts
import * as Phaser from "phaser";
import EventBus from "../EventBus";
import { FlowerManager } from "./FlowerManager";
import { QuizService, QuizQuestion, QuestionType } from "../data/quizData";
import { Game } from "../scenes/Game";
import { createParticles } from "../utils/effects";

/**
 * BonusChallenge class to manage in-game quiz challenges
 * This replaces the separate quiz screen with interactive gameplay elements
 */
export class BonusChallenge {
    private readonly scene: Phaser.Scene;
    private readonly flowerManager: FlowerManager;
    private active: boolean = false;
    private isFinalizing: boolean = false; // guard to prevent double finalize
    private currentQuestion?: QuizQuestion;
    private answerFlowers: Phaser.Physics.Arcade.Sprite[] = [];
    private challengeContainer?: Phaser.GameObjects.Container;
    private challengeTimer?: Phaser.Time.TimerEvent;
    private challengeTimeoutTimer?: Phaser.Time.TimerEvent;
    private readonly bonusScoreValue: number = 25;
    private readonly quizService: QuizService;

    constructor(scene: Phaser.Scene, flowerManager: FlowerManager) {
        this.scene = scene;
        this.flowerManager = flowerManager;
        this.quizService = QuizService.getInstance();
    }

    /**
     * Start a new challenge at random intervals during gameplay
     */
    public scheduleNextChallenge(
        minDelay: number = 20000,
        maxDelay: number = 40000,
    ): void {
        // Random time between min and max delay
        const delay = Phaser.Math.Between(minDelay, maxDelay);

        this.challengeTimer = this.scene.time.delayedCall(delay, () => {
            this.startChallenge();
        });
    }

    /**
     * Start a bonus challenge with a random quiz question
     */
    public startChallenge(): void {
        if (this.active) return; // Don't start if already active

        // Get a random question from the quiz service
        const questions = this.quizService.getRandomQuizQuestions(1);
        if (questions.length === 0) return;

        this.currentQuestion = questions[0];
        this.active = true;

        // Pause normal input while we set up UI
        EventBus.emit("game:set-input-active", false);
        // Dim existing flowers instead of clearing them so progress persists
        this.flowerManager.setDimmed(true);

        // Create UI for the challenge
        this.createChallengeUI();

        // Create answer flowers based on question type
        if (this.currentQuestion.type === QuestionType.MultipleChoice) {
            this.createMultipleChoiceFlowers();
        } else {
            this.createTrueFalseFlowers();
        }

        // Re-enable input AFTER answer flowers exist
        EventBus.emit("game:set-input-active", true);

        // Set up physics overlap for answer flowers
        // Access the bee instance from the scene
        const gameScene = this.scene as Game;
        this.answerFlowers.forEach((flower) => {
            this.scene.physics.add.overlap(
                gameScene.bee, // Access bee from the Game scene
                flower,
                (bee, flower) => {
                    this.handleAnswerSelection(
                        flower as Phaser.Physics.Arcade.Sprite,
                    );
                },
                undefined,
                this,
            );
        });

        // Set a time limit for the challenge and store the timer event
        this.challengeTimeoutTimer = this.scene.time.delayedCall(15000, () => {
            if (this.active) {
                console.log("Bonus Challenge: Time ran out!");
                this.active = false;
                EventBus.emit("game:set-input-active", false);
                this.endChallenge();
                this.finalizeChallengeReset();
            }
        });
    }

    /**
     * Create UI elements for the challenge
     */
    private createChallengeUI(): void {
        if (!this.currentQuestion) return;

        // Create a container for all UI elements
        this.challengeContainer = this.scene.add.container(0, 0);
        this.challengeContainer.setDepth(15);

        // Add semi-transparent background overlay
        const overlay = this.scene.add.rectangle(
            0,
            0,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.5,
        );
        overlay.setOrigin(0);
        this.challengeContainer.add(overlay);

        // Create challenge title
        const title = this.scene.add
            .text(this.scene.cameras.main.width / 2, 80, "BONUS CHALLENGE!", {
                fontFamily: "Arial",
                fontSize: "32px",
                color: "#FFD700",
                stroke: "#000000",
                strokeThickness: 5,
                align: "center",
            })
            .setOrigin(0.5);

        // Create question text
        const questionText = this.scene.add
            .text(
                this.scene.cameras.main.width / 2,
                140,
                this.currentQuestion.question,
                {
                    fontFamily: "Arial",
                    fontSize: "20px",
                    color: "#FFFFFF",
                    stroke: "#000000",
                    strokeThickness: 3,
                    align: "center",
                    wordWrap: { width: this.scene.cameras.main.width - 100 },
                },
            )
            .setOrigin(0.5);

        // Create instruction text
        const instructions = this.scene.add
            .text(
                this.scene.cameras.main.width / 2,
                200,
                "Quickly! Fly to the correct flower to answer!",
                {
                    fontFamily: "Arial",
                    fontSize: "18px",
                    color: "#FFFFFF",
                    align: "center",
                },
            )
            .setOrigin(0.5);

        // Add elements to container
        this.challengeContainer.add(title);
        this.challengeContainer.add(questionText);
        this.challengeContainer.add(instructions);

        // Add appear animation
        this.scene.tweens.add({
            targets: [title, questionText, instructions],
            y: "+=10",
            duration: 300,
            yoyo: true,
            repeat: 2,
            ease: "Sine.easeInOut",
        });
    }

    /**
     * Create flowers representing multiple choice options
     */
    private createMultipleChoiceFlowers(): void {
        const options = this.currentQuestion?.options;
        // If options is null/undefined (meaning either currentQuestion or its options are missing), return.
        if (!options) {
            return;
        }
        // Now we know 'this.currentQuestion' is defined and has 'options' because of the check above.
        // Use the non-null assertion operator (!) to assure TypeScript that currentQuestion is defined here.
        const correctAnswer = this.currentQuestion!.correctAnswer as string;

        // Position flowers in a semi-circle at the bottom of the screen
        const centerX = this.scene.cameras.main.width / 2;
        const bottomY = this.scene.cameras.main.height - 120;
        const radius = 250;

        options.forEach((option, index) => {
            // Calculate position in semi-circle
            const angle = (Math.PI / (options.length - 1)) * index;
            const x = centerX - radius * Math.cos(angle);
            const y = bottomY - radius * Math.sin(angle);

            // Create flower sprite
            const flower = this.scene.physics.add.sprite(
                x,
                y,
                "flower_generated",
            );
            flower.setScale(0.8);

            // Determine if this is the correct answer
            const isCorrect = option === correctAnswer;

            // Store data with the flower
            flower.setData("option", option);
            flower.setData("isCorrect", isCorrect);

            // Set color based on index (for visual distinction)
            const colors = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00];
            flower.setTint(colors[index % colors.length]);

            // Add option text above flower
            const optionText = this.scene.add
                .text(x, y - 60, option, {
                    fontSize: "18px",
                    color: "#FFFFFF",
                    stroke: "#000000",
                    strokeThickness: 3,
                    backgroundColor: "#00000080",
                    padding: { x: 8, y: 4 },
                })
                .setOrigin(0.5);

            // Add to container and store references
            this.challengeContainer?.add(optionText);
            this.answerFlowers.push(flower);

            // Add pulse effect to draw attention
            this.scene.tweens.add({
                targets: flower,
                scale: 0.9,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            });
        });
    }

    /**
     * Create flowers for true/false questions
     */
    private createTrueFalseFlowers(): void {
        if (!this.currentQuestion) return;

        const correctAnswer = this.currentQuestion.correctAnswer as boolean;
        const options = [
            { text: "True", value: true },
            { text: "False", value: false },
        ];

        // Position flowers on left and right sides
        const centerY = this.scene.cameras.main.height / 2;

        options.forEach((option, index) => {
            // Left or right position
            const x = index === 0 ? 200 : this.scene.cameras.main.width - 200;

            // Create flower sprite
            const flower = this.scene.physics.add.sprite(
                x,
                centerY,
                "flower_generated",
            );
            flower.setScale(0.8);

            // Determine if this is the correct answer
            const isCorrect = option.value === correctAnswer;

            // Store data with the flower
            flower.setData("option", option.text);
            flower.setData("isCorrect", isCorrect);

            // Set color based on index (for visual distinction)
            const colors = [0x00ff00, 0xff0000]; // Green for True, Red for False
            flower.setTint(colors[index]);

            // Add option text above flower
            const optionText = this.scene.add
                .text(x, centerY - 60, option.text, {
                    fontSize: "22px",
                    color: "#FFFFFF",
                    stroke: "#000000",
                    strokeThickness: 3,
                    backgroundColor: "#00000080",
                    padding: { x: 10, y: 5 },
                })
                .setOrigin(0.5);

            // Add to container and store references
            this.challengeContainer?.add(optionText);
            this.answerFlowers.push(flower);

            // Add pulse effect to draw attention
            this.scene.tweens.add({
                targets: flower,
                scale: 0.9,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            });
        });
    }

    /**
     * Handle collision between bee and answer flower
     */
    public handleAnswerSelection(flower: Phaser.Physics.Arcade.Sprite): void {
        if (!this.active) return;
        this.active = false; // Deactivate challenge immediately

        // *** Remove the challenge timeout timer as it's no longer needed ***
        if (this.challengeTimeoutTimer) {
            this.challengeTimeoutTimer.remove();
            this.challengeTimeoutTimer = undefined;
        }

        EventBus.emit("game:set-input-active", false);

        const isCorrect = flower.getData("isCorrect") as boolean;

        // Create visual feedback
        if (isCorrect) {
            createParticles(
                this.scene,
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0x00ff00,
                30,
            );
            this.showResult(
                true,
                this.currentQuestion?.explanation ?? "Correct!",
            );

            // Add bonus score
            (this.scene as Game).addBonusScore(this.bonusScoreValue);

            // Record correct answer in quiz service
            this.quizService.recordQuizResults(1, 1);
        } else {
            createParticles(
                this.scene,
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0xff0000,
                15,
            );
            this.showResult(
                false,
                this.currentQuestion?.explanation ?? "Incorrect!",
            );

            // Record incorrect answer in quiz service
            this.quizService.recordQuizResults(0, 1);
        }
    }

    /**
     * Show the result of the challenge
     */
    private showResult(correct: boolean, explanation: string): void {
        // Create result container
        const resultContainer = this.scene.add.container(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
        );
        resultContainer.setDepth(20);

        // Background panel
        const bg = this.scene.add.graphics();
        bg.fillStyle(correct ? 0x006400 : 0x8b0000, 0.9);
        bg.fillRoundedRect(-200, -100, 400, 200, 16);
        resultContainer.add(bg);

        // Result text
        const resultText = this.scene.add
            .text(0, -60, correct ? "CORRECT!" : "INCORRECT!", {
                fontFamily: "Arial",
                fontSize: "28px",
                color: "#FFFFFF",
                fontStyle: "bold",
                align: "center",
            })
            .setOrigin(0.5);
        resultContainer.add(resultText);

        // Explanation text
        const explText = this.scene.add
            .text(0, 0, explanation, {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#FFFFFF",
                align: "center",
                wordWrap: { width: 350 },
            })
            .setOrigin(0.5);
        resultContainer.add(explText);

        // Points text if correct
        if (correct) {
            const pointsText = this.scene.add
                .text(0, 60, `+${this.bonusScoreValue} POINTS!`, {
                    fontFamily: "Arial",
                    fontSize: "22px",
                    color: "#FFD700",
                    fontStyle: "bold",
                    align: "center",
                })
                .setOrigin(0.5);
            resultContainer.add(pointsText);
        }

        // Add appear animation
        resultContainer.setScale(0);
        this.scene.tweens.add({
            targets: resultContainer,
            scale: 1,
            duration: 300,
            ease: "Back.easeOut",
            onComplete: () => {
                // Add a delayed call to fade out and destroy the result popup
                this.scene.time.delayedCall(2500, () => {
                    if (resultContainer?.scene) {
                        this.scene.tweens.add({
                            targets: resultContainer,
                            alpha: 0,
                            duration: 200,
                            ease: "Power1",
                            onComplete: () => {
                                if (resultContainer?.scene) {
                                    resultContainer.destroy();
                                }
                                // *** Only call finalizeChallengeReset HERE ***
                                this.finalizeChallengeReset();
                            },
                        });
                    } else {
                        // If container somehow gone, still finalize
                        this.finalizeChallengeReset();
                    }
                });
            },
        });
    }

    /**
     * Resets game state, cleans up UI, and schedules the next challenge.
     * Called after the result popup is handled or on timeout.
     */
    private finalizeChallengeReset(): void {
        if (this.isFinalizing) return; // guard
        this.isFinalizing = true;
        console.log("Bonus Challenge: Finalizing reset...");

        // 1. Reset the core game state first
        this.resetGameToNormal();

        // 2. Clean up the challenge UI elements
        this.endChallenge();

        // 3. Schedule the next challenge
        this.scheduleNextChallenge();
    }

    /**
     * End the current challenge - Cleans up UI elements
     */
    public endChallenge(): void {
        // Only cleans up UI and flowers, does NOT reset game state directly

        // Ensure we only run this once for UI cleanup
        if (!this.challengeContainer && this.answerFlowers.length === 0) return;

        // Also clear the timeout timer here as a safety measure
        if (this.challengeTimeoutTimer) {
            this.challengeTimeoutTimer.remove();
            this.challengeTimeoutTimer = undefined;
        }

        // Immediately destroy answer flowers
        this.answerFlowers.forEach((flower) => {
            if (flower?.scene) {
                flower.destroy();
            }
        });
        this.answerFlowers = [];

        // Start fading out the main challenge UI container
        if (this.challengeContainer) {
            const containerToDestroy = this.challengeContainer;
            this.challengeContainer = undefined; // Clear reference
            this.scene.tweens.add({
                targets: containerToDestroy,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (containerToDestroy?.scene) {
                        containerToDestroy.destroy();
                    }
                },
            });
        }
        // Note: active flag is managed by handleAnswerSelection and the timeout
    }

    /**
     * Helper function to reset the game state after a challenge
     */
    private resetGameToNormal(): void {
        console.log("Bonus Challenge: Resetting game to normal state.");
        // Re-enable regular gameplay input and timer
        EventBus.emit("game:set-input-active", true);
        console.log("Bonus Challenge: Input re-enabled.");
        // Restore flower visuals
        this.flowerManager.setDimmed(false);
        this.isFinalizing = false; // allow future challenges
    }

    /**
     * Clean up resources when scene is shut down
     */
    public destroy(): void {
        this.challengeTimer?.remove();
        this.challengeTimeoutTimer?.remove(); // Ensure timeout timer is removed on destroy
        this.challengeContainer?.destroy();
        this.answerFlowers.forEach((flower) => {
            if (flower?.scene) flower.destroy();
        });
        this.answerFlowers = [];
        console.log("BonusChallenge destroyed.");
    }

    /**
     * Check if a bonus challenge is active
     */
    public isActive(): boolean {
        return this.active;
    }
}
