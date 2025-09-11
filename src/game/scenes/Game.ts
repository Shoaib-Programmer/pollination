// src/game/scenes/Game.ts
import * as Phaser from "phaser";
import EventBus from "../EventBus";
// Import the new components
import { Bee } from "../entities/Bee";
import { FlowerManager, FlowerData } from "../managers/FlowerManager"; // Import interface too
import { GameTimer } from "../managers/GameTimer";
import { BonusChallenge } from "../managers/BonusChallenge"; // Import BonusChallenge from its new location
import { createParticles, addInteractionPulse } from "../utils/effects"; // Import utils
import { createFloatingScoreTween } from "../utils/animation"; // Import animation utils
import {
    registerEventHandlers,
    unregisterEventHandlers,
    COMMON_EVENTS,
} from "../utils/eventUtils"; // Import event utils

// Keep type alias if needed, or rely on Phaser's types directly
type ArcadePhysicsCallback = Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;

export class Game extends Phaser.Scene {
    // Entities and Managers
    public bee!: Bee; // Make bee public for BonusChallenge access
    private flowers!: Phaser.Physics.Arcade.StaticGroup; // Group managed by FlowerManager
    private flowerManager!: FlowerManager;
    private gameTimer!: GameTimer;
    private bonusChallenge!: BonusChallenge; // New bonus challenge manager
    private mainPhysicsOverlap?: { active: boolean }; // Track main physics overlap

    // Input
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private dpadState = { up: false, down: false, left: false, right: false };
    private inputEnabled: boolean = true;

    // Game State
    private score: number = 0;
    // Pollen indicator state now primarily managed here, passed to Bee if needed
    private pollenIndicator: Phaser.GameObjects.Sprite | null = null;
    private pollenIndicatorTween: Phaser.Tweens.Tween | null = null;
    private completedFlowers: number = 0;
    private pollinationCount: number = 0;
    private currentWave: number = 1;

    // Event handlers for cleanup
    private eventHandlers: Array<{
        event: string;
        handler: (...args: unknown[]) => void;
        context: unknown;
    }> = [];

    // Config
    private readonly gameDuration: number = 60; // Seconds

    constructor() {
        super("Game");
    }

    async create() {
        this.add.image(400, 300, "background_generated");
        this.flowers = this.physics.add.staticGroup();
        this.flowerManager = new FlowerManager(this, this.flowers);
        this.bee = new Bee(this, 100, this.cameras.main.height / 2); // Create Bee instance
        this.bonusChallenge = new BonusChallenge(this, this.flowerManager); // Bonus challenge manager

        // --- Flower Setup (using Manager) ---
        this.flowerManager.spawnFlowers(6, "red"); // (Removed duplicate spawn)
        this.flowerManager.spawnFlowers(6, "blue");
        this.flowerManager.assignInitialPollen();

        // --- Physics ---
        this.mainPhysicsOverlap = this.physics.add.overlap(
            this.bee,
            this.flowers,
            this.handleBeeFlowerCollision as ArcadePhysicsCallback, // Keep collision handler here
            undefined,
            this,
        );

        // --- Input ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        } else {
            console.error("Keyboard input plugin not found.");
        }

        // Register event handlers using utility
        this.eventHandlers = [
            {
                event: COMMON_EVENTS.DPAD,
                handler: this.handleDpadInput,
                context: this,
            },
            {
                event: COMMON_EVENTS.GAME_SET_INPUT_ACTIVE,
                handler: this.setInputActive,
                context: this,
            },
        ];
        registerEventHandlers(this.eventHandlers);

        // --- Timer Setup (using Manager) ---
        this.gameTimer = new GameTimer(
            this,
            this.gameDuration,
            (time) => this.events.emit(COMMON_EVENTS.GAME_UPDATE_TIMER, time), // Update callback
            () => this.handleTimeUp(), // Completion callback
        );

        // --- State Reset ---
        this.resetGameState(); // Encapsulate reset logic

        // --- Start Timer ---
        this.gameTimer.start();

        // --- Initial UI Events ---
        this.events.emit(COMMON_EVENTS.GAME_UPDATE_SCORE, this.score);
        // Timer manager handles initial emit via its start()

        // --- Schedule first bonus challenge ---
        this.bonusChallenge.scheduleNextChallenge(15000, 25000); // First one appears between 15-25 seconds

        // --- Scene Cleanup ---
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    }

    private resetGameState(): void {
        this.score = 0;
        // Bee's internal pollen state if it managed it, or reset here if scene manages
        this.bee.carryingPollenType = null;
        // Destroy any lingering indicators from a previous run
        this.pollenIndicator?.destroy();
        this.pollenIndicator = null;
        this.pollenIndicatorTween?.stop();
        this.pollenIndicatorTween = null;
        this.bee.setPollenIndicator(null); // Tell bee its indicator is gone

        this.inputEnabled = true;
        this.dpadState = { up: false, down: false, left: false, right: false };
        this.completedFlowers = 0;
        this.pollinationCount = 0;
        this.currentWave = 1;

        // Reset visual/physics state of bee if restarting scene
        if (this.bee?.body) {
            this.bee.setVelocity(0);
            this.bee.stopFlappingAnimation(true); // Stop immediately, reset scale
            (this.bee.body as Phaser.Physics.Arcade.Body).enable = true;
        }
    }

    // Enable/disable main physics overlap for bonus challenges
    public setMainPhysicsOverlapActive(active: boolean): void {
        if (this.mainPhysicsOverlap) {
            this.mainPhysicsOverlap.active = active;
        }
    }

    // Add bonus score from challenges
    public addBonusScore(points: number): void {
        this.score += points;
        this.events.emit(COMMON_EVENTS.GAME_UPDATE_SCORE, this.score);

        // Show floating score text
        const scoreText = this.add
            .text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 - 50,
                `+${points}`,
                {
                    fontFamily: "Arial",
                    fontSize: "28px",
                    color: "#FFD700",
                    stroke: "#000000",
                    strokeThickness: 4,
                },
            )
            .setOrigin(0.5);

        // Animate and remove using utility
        createFloatingScoreTween(this, scoreText, points);
    }

    // Called by GameTimer when time is up
    private handleTimeUp(): void {
        if (!this.scene.isActive()) return; // Prevent actions if scene shutting down

        // End any active bonus challenge
        if (this.bonusChallenge.isActive()) {
            this.bonusChallenge.endChallenge();
        }

        this.inputEnabled = false; // Set flag to disable input logic in update
        // Note: update loop will handle disabling body/velocity

        this.time.delayedCall(1500, () => {
            if (this.scene.isActive()) {
                this.scene.start("GameOver", {
                    score: this.score,
                    completedFlowers: this.completedFlowers,
                    totalTime:
                        this.gameDuration - this.gameTimer.getRemainingTime(),
                    currentWave: this.currentWave,
                });
            }
        });
    }

    private setInputActive(...args: unknown[]): void {
        const isActive = args[0] as boolean;
        if (this.inputEnabled === isActive) return;
        this.inputEnabled = isActive;

        if (!isActive) {
            // --- Disable ---
            // Update loop handles body disable/velocity stop
            this.gameTimer.pause(); // Use timer manager method
            this.dpadState = {
                up: false,
                down: false,
                left: false,
                right: false,
            };
            // Tell bee to stop animating immediately
            this.bee.stopFlappingAnimation(true);
        } else {
            // --- Enable ---
            // Update loop handles body enable
            this.gameTimer.resume(); // Use timer manager method
            this.input.keyboard?.resetKeys();
            this.dpadState = {
                up: false,
                down: false,
                left: false,
                right: false,
            };
            // Bee animation will restart on movement in update
        }
    }

    // Handles DPad input events - Remains in Scene
    private handleDpadInput(...args: unknown[]): void {
        const data = args[0] as {
            direction: "up" | "down" | "left" | "right";
            active: boolean;
        };
        if (this.inputEnabled && data.direction in this.dpadState) {
            this.dpadState[data.direction] = data.active;
        }
    }

    // --- Update Loop ---
    update(_time: number, _delta: number): void {
        if (!this.bee?.body) return; // Guard clause

        const beeBody = this.bee.body as Phaser.Physics.Arcade.Body;

        // Manage body enable state based on inputEnabled flag
        if (!this.inputEnabled) {
            if (beeBody.enable) {
                beeBody.enable = false;
                this.bee.setVelocity(0); // Stop motion *after* disabling body
                this.bee.stopFlappingAnimation(true); // Ensure animation stopped visually
            } else if (beeBody.velocity.x !== 0 || beeBody.velocity.y !== 0) {
                // Redundant velocity check if body is disabled, but safe
                this.bee.setVelocity(0);
            }
        } else {
            // Input IS enabled
            if (!beeBody.enable) {
                beeBody.enable = true; // Re-enable body BEFORE movement processing
            }
            // Delegate movement logic to the Bee entity only if body is enabled
            if (beeBody.enable) {
                this.bee.updateMovement(this.cursors, this.dpadState);
            } else {
                // This branch should theoretically not be reached if inputEnabled is true,
                // as the body is enabled just before this check. Leaving warn for safety.
                console.warn(
                    "GAME Update: inputEnabled=TRUE but body is still disabled?",
                );
            }
        }
        // Note: Pollen indicator position update is now handled within bee.updateMovement
    }

    // --- Collision Handling - Remains in Scene ---
    handleBeeFlowerCollision(
        beeGO:
            | Phaser.Types.Physics.Arcade.GameObjectWithBody
            | Phaser.Tilemaps.Tile,
        flowerGO:
            | Phaser.Types.Physics.Arcade.GameObjectWithBody
            | Phaser.Tilemaps.Tile,
    ): void {
        // Ensure correct types and that it's *our* bee
        if (
            !(beeGO instanceof Bee) ||
            !(flowerGO instanceof Phaser.Physics.Arcade.Sprite) ||
            beeGO !== this.bee
        ) {
            return;
        }
        // No need to check inputEnabled/body.enable here - physics system handles that

        // During bonus challenges, the main physics overlap is disabled
        // so this handler should not be called for regular gameplay flowers
        if (this.bonusChallenge.isActive()) {
            // This should not happen since we disable the main physics overlap during challenges
            console.warn(
                "Main game collision detected during bonus challenge - this should not happen",
            );
            return;
        }

        const flower = flowerGO;
        const data = flower.getData("flowerData") as FlowerData | undefined;
        if (!data) return;

        // --- Pollen Collection ---
        if (
            !this.bee.carryingPollenType &&
            data.hasPollen &&
            !data.isPollinated
        ) {
            this.bee.carryingPollenType = data.type; // Update Bee's state
            data.hasPollen = false;
            flower.clearTint();

            // Destroy previous indicator if any (safety check)
            this.pollenIndicator?.destroy();
            this.pollenIndicatorTween?.stop();

            // Create and manage indicator within the Scene
            this.pollenIndicator = this.add
                .sprite(
                    this.bee.x,
                    this.bee.y - 25,
                    "pollen_particle_generated",
                )
                .setDepth(11)
                .setTint(data.type === "red" ? 0xffaaaa : 0xaaaaff)
                .setScale(0)
                .setAlpha(0);

            // Animate indicator appearance
            this.tweens.add({
                targets: this.pollenIndicator,
                scale: 2.5,
                alpha: 1,
                duration: 200,
                ease: "Power1",
            });
            this.pollenIndicatorTween = this.tweens.add({
                targets: this.pollenIndicator,
                scale: 2.8,
                duration: 400,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
                delay: 200,
            });

            // Pass indicator reference to the Bee so it can update position
            this.bee.setPollenIndicator(
                this.pollenIndicator,
            );

            // Use utility functions for effects
            createParticles(
                this,
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0xffff00,
                15,
            );
            addInteractionPulse(this, flower);
            addInteractionPulse(this, this.bee, 1.05);
        }
        // --- Pollen Delivery ---
        else if (
            this.bee.carryingPollenType &&
            data.type === this.bee.carryingPollenType &&
            !data.isPollinated &&
            !data.hasPollen
        ) {
            data.isPollinated = true;
            flower.setTint(0x90ee90); // Green tint for pollinated
            this.score += 10;
            this.completedFlowers++;
            this.pollinationCount++;
            this.events.emit(COMMON_EVENTS.GAME_UPDATE_SCORE, this.score);

            // Destroy pollen indicator visually
            if (this.pollenIndicator) {
                this.pollenIndicatorTween?.stop();
                this.tweens.add({
                    targets: this.pollenIndicator,
                    alpha: 0,
                    scale: 0,
                    duration: 200,
                    ease: "Power1",
                    onComplete: () => this.pollenIndicator?.destroy(),
                });
                // Clear references
                this.pollenIndicator = null;
                this.pollenIndicatorTween = null;
                this.bee.setPollenIndicator(null); // Tell Bee indicator is gone
            }

            this.bee.carryingPollenType = null; // Clear Bee's state

            // Use utility functions for effects
            createParticles(
                this,
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0x90ee90,
                25,
            );
            addInteractionPulse(this, flower);
            addInteractionPulse(this, this.bee, 1.05);

            // --- Win Logic ---
            this.handlePollinationOutcome(); // Extract complex logic
        }
    }

    // Extracted logic for handling what happens after successful pollination
    private handlePollinationOutcome(): void {
        void this._processPollinationLogic();
    }

    // Central function to process the outcome of pollination
    private _processPollinationLogic(): void {
        try {
            // Priority 1: Check for Win Condition and handle end game if needed
            const winResult = this._checkAndHandleWinCondition();
            if (winResult.shouldEnd) {
                // Game ending sequence is initiated within _checkAndHandleWinCondition
            } else {
                // Game continues... check if we should trigger bonus challenge
                this._tryTriggerBonusChallenge();

                // --- Assign More Pollen (only if game isn't ending) ---
                this._assignPollenAndEffects();
            }
        } catch (error) {
            this._handlePollinationError(error); // Use the dedicated error handler
        }
    }

    // --- Pollination Outcome Helper Methods ---

    // Checks if all flowers are pollinated and spawns new wave if so
    private _checkAndHandleWinCondition(): {
        shouldEnd: boolean;
    } {
        if (this.flowerManager.checkAllPollinated()) {
            this.spawnNewWave(); // Spawn new wave instead of ending
            return {
                shouldEnd: false,
            };
        }
        return { shouldEnd: false };
    }

    // Checks conditions and potentially triggers a bonus challenge
    private _tryTriggerBonusChallenge(): void {
        const meetsThreshold = this.pollinationCount >= 10;
        const challengeInactive = !this.bonusChallenge.isActive();
        // Use a random chance to trigger
        const shouldAttemptTrigger =
            meetsThreshold &&
            challengeInactive &&
            Phaser.Math.Between(1, 100) <= 40;

        if (shouldAttemptTrigger) {
            this.time.delayedCall(1500, () => {
                // Double-check state inside the delayed call, as things might change
                if (this.scene.isActive() && !this.bonusChallenge.isActive()) {
                    this.bonusChallenge.startChallenge();
                }
            });
        }
    }

    // Assigns more pollen if needed and applies visual effects
    private _assignPollenAndEffects(): void {
        const newFlower =
            this.flowerManager.assignMorePollenIfNeededReturnFlower();
        if (newFlower) {
            createParticles(
                this,
                newFlower.x,
                newFlower.y,
                "pollen_particle_generated",
                0xffff00,
                10,
            );
            addInteractionPulse(this, newFlower);
        }
    }

    // Handles errors during pollination processing
    private _handlePollinationError(error: unknown): void {
        console.error("Error processing pollination outcome:", error);
        // Always check win condition, even after an error during processing
        const winResult = this._checkAndHandleWinCondition();
        if (winResult.shouldEnd) {
            // If game ends due to win condition despite error, continue with end sequence
        } else {
            // If an error occurred but it didn't lead to a win condition,
            // log a warning. Avoid further game actions like assigning pollen
            // as the state might be inconsistent after the error.
            console.warn(
                "Continuing game after non-fatal pollination outcome error.",
            );
        }
    }

    // Spawns a new wave of flowers when current wave is completed
    private spawnNewWave(): void {
        if (!this.scene.isActive()) return;

        // Increment wave counter
        this.currentWave++;

        // Clear completed flowers
        this.flowerManager.clearFlowers();

        // Calculate flower count for this wave (progressive difficulty)
        const baseFlowerCount = 6;
        const waveBonus = Math.floor((this.currentWave - 1) / 2); // +1 flower every 2 waves
        const flowerCount = Math.min(baseFlowerCount + waveBonus, 12); // Cap at 12 flowers

        // Spawn new flowers
        this.flowerManager.spawnFlowers(flowerCount, "red");
        this.flowerManager.spawnFlowers(flowerCount, "blue");
        this.flowerManager.assignInitialPollen();

        // Bonus points for completing a wave
        const waveBonusPoints = this.currentWave * 50;
        this.addBonusScore(waveBonusPoints);

        // Show wave complete message
        this.showWaveCompleteMessage(this.currentWave);

        // Add some visual effects
        this.time.delayedCall(500, () => {
            if (this.scene.isActive()) {
                createParticles(
                    this,
                    this.cameras.main.width / 2,
                    this.cameras.main.height / 2,
                    "pollen_particle_generated",
                    0xffd700, // Gold color
                    20,
                );
            }
        });
    }

    // Shows a message when a wave is completed
    private showWaveCompleteMessage(waveNumber: number): void {
        const message = this.add
            .text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 - 100,
                `Wave ${waveNumber - 1} Complete!\nWave ${waveNumber} Starting...`,
                {
                    fontFamily: "Arial",
                    fontSize: "32px",
                    color: "#FFD700",
                    stroke: "#000000",
                    strokeThickness: 4,
                    align: "center",
                },
            )
            .setOrigin(0.5);

        // Animate the message
        this.tweens.add({
            targets: message,
            scale: { from: 0.5, to: 1.2 },
            alpha: { from: 0, to: 1 },
            duration: 800,
            ease: "Bounce.easeOut",
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    if (message && message.scene) {
                        message.destroy();
                    }
                });
            },
        });
    }

    // Common logic for ending the game when all flowers are done
    private endGameDueToCompletion(): void {
        if (!this.scene.isActive()) return;
        this.inputEnabled = false; // Prevent further input
        this.gameTimer.pause(); // Stop timer visually
        // Update loop will disable body etc.

        // Use a longer delay to allow the HUD message to be read (matching the HUD display time)
        this.time.delayedCall(2000, () => {
            if (this.scene.isActive()) {
                this.scene.start("GameOver", {
                    score: this.score,
                    completedFlowers: this.completedFlowers,
                    totalTime:
                        this.gameDuration - this.gameTimer.getRemainingTime(),
                    currentWave: this.currentWave,
                });
            }
        });
    }

    // --- Scene Shutdown ---
    shutdown(): void {
        console.log("Game Scene Shutting Down");

        // Signal scene change through EventBus
        EventBus.emit(COMMON_EVENTS.SCENE_CHANGED, "shutdown");

        // Clean up EventBus listeners using utility
        unregisterEventHandlers(this.eventHandlers);

        // Clean up managers and entities THAT ARE NOT AUTOMATICALLY DESTROYED BY PHASER
        // Phaser handles destroying scene-added game objects (like the Bee sprite)
        // and scene systems (like tweens, time events added directly to the scene)
        this.gameTimer?.destroy(); // Important: Stop the timer's internal Phaser timer event
        this.bonusChallenge?.destroy(); // Clean up the bonus challenge manager

        // Explicitly kill tweens targeting objects if needed, though scene shutdown often handles this
        // The Bee class already handles its own GSAP cleanup in its destroy method
        this.pollenIndicatorTween?.stop(); // Stop any active indicator tween

        // No need to call bee.destroy() manually if it was added via scene.add.existing / scene.physics.add.existing
        // Phaser's scene shutdown process should handle destroying it.

        // Clear local references
        this.cursors = undefined;
        this.pollenIndicator = null;
        this.pollenIndicatorTween = null;
        // (bee, flowerManager etc will be garbage collected if scene is destroyed)
    }
}
