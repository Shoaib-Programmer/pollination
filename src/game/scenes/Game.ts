// src/game/scenes/Game.ts
import * as Phaser from "phaser";
import EventBus from "../EventBus";
import POLLINATION_FACTS from "../data/pollinationFacts";
import flowerCollectionService from "@/services/FlowerCollectionService";

// Import the new components
import { Bee } from "../entities/Bee";
import { FlowerManager, FlowerData } from "../managers/FlowerManager"; // Import interface too
import { GameTimer } from "../managers/GameTimer";
import { BonusChallenge } from "../managers/BonusChallenge"; // Import BonusChallenge from its new location
import { createParticles, addInteractionPulse } from "../utils/effects"; // Import utils

// Keep type alias if needed, or rely on Phaser's types directly
type ArcadePhysicsCallback = Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;

export class Game extends Phaser.Scene {
    // Entities and Managers
    public bee!: Bee; // Make bee public for BonusChallenge access
    private flowers!: Phaser.Physics.Arcade.StaticGroup; // Group managed by FlowerManager
    private flowerManager!: FlowerManager;
    private gameTimer!: GameTimer;
    private bonusChallenge!: BonusChallenge; // New bonus challenge manager

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
    private pollinationFactThreshold: number = 5;
    private discoveredFlowerIds: Set<string> = new Set();

    // HUD-style fact display
    private factHUD: {
        container: Phaser.GameObjects.Container | null;
        background: Phaser.GameObjects.Graphics | null;
        text: Phaser.GameObjects.Text | null;
        icon: Phaser.GameObjects.Sprite | null;
        tween: Phaser.Tweens.Tween | Phaser.Tweens.TweenChain | null;
    } = {
        container: null,
        background: null,
        text: null,
        icon: null,
        tween: null,
    };

    // Config
    private readonly gameDuration: number = 60; // Seconds
    private showFacts: boolean = true; // Knowledge Nectar setting

    constructor() {
        super("Game");
    }

    async create() {
        // Load settings first
        await this.loadSettings();

        this.add.image(400, 300, "background_generated");
        this.flowers = this.physics.add.staticGroup();
        this.flowerManager = new FlowerManager(this, this.flowers);
        this.bee = new Bee(this, 100, this.cameras.main.height / 2); // Create Bee instance
        this.bonusChallenge = new BonusChallenge(this, this.flowerManager); // Bonus challenge manager

        // --- Flower Setup (using Manager) ---
        this.flowerManager.spawnFlowers(6, "red");
        // --- Flower Setup (using Manager) ---
        this.flowerManager.spawnFlowers(6, "red");
        this.flowerManager.spawnFlowers(6, "blue");
        this.flowerManager.assignInitialPollen();

        // --- Physics ---
        this.physics.add.overlap(
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
        EventBus.on("dpad", this.handleDpadInput, this);
        EventBus.on("game:set-input-active", this.setInputActive, this);

        // --- Timer Setup (using Manager) ---
        this.gameTimer = new GameTimer(
            this,
            this.gameDuration,
            (time) => this.events.emit("game:update-timer", time), // Update callback
            () => this.handleTimeUp(), // Completion callback
        );

        // --- State Reset ---
        this.resetGameState(); // Encapsulate reset logic

        // --- Start Timer ---
        this.gameTimer.start();

        // --- Initial UI Events ---
        this.events.emit("game:update-score", this.score);
        // Timer manager handles initial emit via its start()

        // --- Schedule first bonus challenge ---
        this.bonusChallenge.scheduleNextChallenge(15000, 25000); // First one appears between 15-25 seconds

        // --- Scene Cleanup ---
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    }

    // Load settings from storage service
    private async loadSettings(): Promise<void> {
        try {
            const storageService = (await import("@/services/StorageService"))
                .default;
            const progress = await storageService.getProgress();
            if (progress && progress.settings) {
                // Load Knowledge Nectar setting
                this.showFacts =
                    progress.settings.knowledgeNectar !== undefined
                        ? progress.settings.knowledgeNectar
                        : true; // Default to true if not specified
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            // Keep default setting if storage fails
            this.showFacts = true;
        }
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
        this.bee.setPollenIndicator(null, null); // Tell bee its indicator is gone

        this.inputEnabled = true;
        this.dpadState = { up: false, down: false, left: false, right: false };
        this.completedFlowers = 0;
        this.pollinationCount = 0;
        this.discoveredFlowerIds.clear();

        // Reset visual/physics state of bee if restarting scene
        if (this.bee && this.bee.body) {
            this.bee.setVelocity(0);
            this.bee.stopFlappingAnimation(true); // Stop immediately, reset scale
            (this.bee.body as Phaser.Physics.Arcade.Body).enable = true;
        }
    }

    // Add bonus score from challenges
    public addBonusScore(points: number): void {
        this.score += points;
        this.events.emit("game:update-score", this.score);

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

        // Animate and remove
        this.tweens.add({
            targets: scoreText,
            y: "-=50",
            alpha: 0,
            duration: 1500,
            ease: "Power1",
            onComplete: () => scoreText.destroy(),
        });
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

        this.events.emit("game:show-fact", "Time's Up!");

        this.time.delayedCall(1500, () => {
            if (this.scene.isActive()) {
                this.scene.start("GameOver", {
                    score: this.score,
                });
            }
        });
    }

    private setInputActive(isActive: boolean): void {
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
    private handleDpadInput(data: {
        direction: "up" | "down" | "left" | "right";
        active: boolean;
    }): void {
        if (this.inputEnabled && data.direction in this.dpadState) {
            this.dpadState[data.direction] = data.active;
        }
    }

    // --- Update Loop ---
    update(time: number, delta: number): void {
        if (!this.bee || !this.bee.body) return; // Guard clause

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

        // Check if we're in a bonus challenge
        if (this.bonusChallenge.isActive()) {
            // Handle answer selection for quiz flowers
            this.bonusChallenge.handleAnswerSelection(
                flowerGO as Phaser.Physics.Arcade.Sprite,
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
                this.pollenIndicatorTween,
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
            this.events.emit("game:update-score", this.score);

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
                this.bee.setPollenIndicator(null, null); // Tell Bee indicator is gone
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

            // --- Fact/Discovery/Win Logic ---
            this.handlePollinationOutcome(data); // Extract complex logic
        }
    }

    // Extracted logic for handling what happens after successful pollination
    private handlePollinationOutcome(pollinatedFlowerData: FlowerData): void {
        const flowerId = pollinatedFlowerData.flowerId;

        // Use async/await inside an immediately invoked async function (IIFE)
        (async () => {
            try {
                let isNewDiscovery = false;
                if (flowerId) {
                    // Await the discovery check and convert the result to a boolean
                    const discoveryResult =
                        await flowerCollectionService.discoverFlower(flowerId);
                    isNewDiscovery = discoveryResult !== undefined;
                }

                let factToEmit = "";
                let showFactHUD = false; // Flag to control showing the HUD
                let gameShouldEnd = false;

                // --- Priority 1: Check for Win Condition ---
                // This check MUST happen regardless of discovery status
                if (this.flowerManager.checkAllPollinated()) {
                    factToEmit = `All flowers pollinated! Great job!`;
                    showFactHUD = true;
                    gameShouldEnd = true;
                    this.endGameDueToCompletion(); // Start the end game sequence
                }

                // --- Priority 2: Handle Discovery (if game isn't ending) ---
                if (!gameShouldEnd && isNewDiscovery && flowerId) {
                    this.discoveredFlowerIds.add(flowerId);
                    // Overwrite or set fact message for discovery
                    factToEmit = `New flower type discovered: ${flowerId}!`;
                    showFactHUD = true;
                }
                // --- Priority 3: Handle Threshold Fact (if game isn't ending and not a discovery) ---
                else if (
                    !gameShouldEnd &&
                    !isNewDiscovery &&
                    this.pollinationCount % this.pollinationFactThreshold === 0
                ) {
                    const randomFact = Phaser.Math.RND.pick(POLLINATION_FACTS);
                    factToEmit = `${this.pollinationCount} flowers pollinated! ${randomFact}`;
                    showFactHUD = true;

                    // Maybe trigger a bonus challenge after reaching the threshold
                    if (
                        this.pollinationCount >= 10 &&
                        !this.bonusChallenge.isActive() &&
                        Phaser.Math.Between(1, 100) <= 40
                    ) {
                        this.time.delayedCall(1500, () => {
                            this.bonusChallenge.startChallenge();
                        });
                    }
                }

                // --- Assign More Pollen (only if game isn't ending) ---
                if (!gameShouldEnd) {
                    const pollenAdded =
                        this.flowerManager.assignMorePollenIfNeeded();
                    if (pollenAdded) {
                        // Find the flower that just got pollen to add effects
                        const newlyPollenedFlower = (
                            this.flowerManager
                                .getGroup()
                                .getChildren() as Phaser.Physics.Arcade.Sprite[]
                        ).find((f) => {
                            const fd = f.getData("flowerData") as FlowerData;
                            // Refine check: Look for a flower that now has pollen and maybe yellow tint
                            return fd.hasPollen && f.tintTopLeft === 0xffff00;
                        });
                        if (newlyPollenedFlower) {
                            createParticles(
                                this,
                                newlyPollenedFlower.x,
                                newlyPollenedFlower.y,
                                "pollen_particle_generated",
                                0xffff00,
                                10,
                            );
                            addInteractionPulse(this, newlyPollenedFlower);
                        }
                    }
                }

                // --- Show Fact HUD (if applicable) ---
                if (showFactHUD && factToEmit && this.showFacts) {
                    const flowerSprite = (
                        this.flowerManager
                            .getGroup()
                            .getChildren() as Phaser.Physics.Arcade.Sprite[]
                    ).find(
                        (f) => f.getData("flowerData") === pollinatedFlowerData,
                    );

                    if (flowerSprite) {
                        this.showInWorldText(factToEmit);
                    } else {
                        // Fallback position if sprite not found
                        this.showInWorldText(factToEmit);
                    }
                }
            } catch (error) {
                console.error("Error processing pollination outcome:", error);
                // Ensure the fallback also correctly checks the win condition first
                if (this.flowerManager.checkAllPollinated()) {
                    this.showInWorldText("All flowers pollinated! Great job!");
                    this.endGameDueToCompletion();
                } else {
                    // Call the rest of the fallback if not a win condition
                    this.handlePollinationErrorFallback(); // Original fallback handles non-win errors/scenarios
                }
            }
        })(); // Immediately invoke the async function
    }

    // Fallback logic for pollination outcome if error or no flowerId
    private handlePollinationErrorFallback(): void {
        // Win condition is now checked in the main catch block
        // Only handle threshold-based facts and pollen assignment
        if (this.pollinationCount % this.pollinationFactThreshold === 0) {
            const randomFact = Phaser.Math.RND.pick(POLLINATION_FACTS);
            const factText = `${this.pollinationCount} flowers pollinated! ${randomFact}`;

            // Show in HUD
            this.showInWorldText(factText);
        }

        // Assign more pollen if needed (this is safe as the main handler ensures
        // we don't reach here if the game should be ending)
        const pollenAdded = this.flowerManager.assignMorePollenIfNeeded();
        if (pollenAdded) {
            // Find the flower that just got pollen to add effects
            const newlyPollenedFlower = (
                this.flowerManager
                    .getGroup()
                    .getChildren() as Phaser.Physics.Arcade.Sprite[]
            ).find((f) => {
                const fd = f.getData("flowerData") as FlowerData;
                return fd.hasPollen && f.tintTopLeft === 0xffff00; // Check tint as indicator
            });
            if (newlyPollenedFlower) {
                createParticles(
                    this,
                    newlyPollenedFlower.x,
                    newlyPollenedFlower.y,
                    "pollen_particle_generated",
                    0xffff00,
                    10,
                );
                addInteractionPulse(this, newlyPollenedFlower);
            }
        }
    }

    // Common logic for ending the game when all flowers are done
    private endGameDueToCompletion(): void {
        if (!this.scene.isActive()) return;
        this.inputEnabled = false; // Prevent further input
        this.gameTimer.pause(); // Stop timer visually
        // Update loop will disable body etc.

        // Use a longer delay to allow the HUD message to be read (matching the HUD display time)
        this.time.delayedCall(6500, () => {
            // Increased from 500ms to 6500ms to match HUD animation duration
            if (this.scene.isActive()) {
                this.scene.start("GameOver", {
                    score: this.score,
                    completedFlowers: this.completedFlowers,
                    totalTime:
                        this.gameDuration - this.gameTimer.getRemainingTime(),
                });
            }
        });
    }

    // Display a fact in an appealing HUD style
    private showInWorldText(text: string): void {
        // Clean up any existing HUD element
        if (this.factHUD.container) {
            this.factHUD.tween?.stop();
            this.factHUD.container.destroy();
            this.factHUD = {
                container: null,
                background: null,
                text: null,
                icon: null,
                tween: null,
            };
        }

        // Create a container for all HUD elements
        this.factHUD.container = this.add.container(0, 0);
        this.factHUD.container.setDepth(20);

        // Create stylized background using Graphics for gradient effect
        this.factHUD.background = this.add.graphics();

        // Calculate text dimensions with proper padding
        const tempText = this.add.text(0, 0, text, {
            fontFamily: "Arial",
            fontSize: "16px",
            color: "#ffffff",
            align: "center",
            fontStyle: "bold",
            wordWrap: { width: 300 },
        });
        const textWidth = Math.max(tempText.width + 60, 200); // Minimum width with padding
        const textHeight = tempText.height + 35; // Height with padding
        tempText.destroy();

        // Position the HUD at the bottom center of the screen
        const hudX = this.scale.width / 2;
        const hudY = this.scale.height - 80;

        // Add icon (pollen or flower icon)
        this.factHUD.icon = this.add
            .sprite(
                hudX - textWidth / 2 + 25,
                hudY,
                "pollen_particle_generated",
            )
            .setTint(0x34d399)
            .setScale(2.5);
        this.factHUD.container.add(this.factHUD.icon);

        // Create rounded rectangle background with gradient
        const bgGraphics = this.factHUD.background;

        // Background gradient fill
        const gradientColors = [0x3a506b, 0x1c2541]; // Dark blue gradient
        const cornerRadius = 15;

        // Draw the rounded rectangle with gradient
        bgGraphics.clear();
        bgGraphics.fillStyle(gradientColors[0], 0.95);
        bgGraphics.fillRoundedRect(
            hudX - textWidth / 2,
            hudY - textHeight / 2,
            textWidth,
            textHeight,
            cornerRadius,
        );

        // Add highlight/shadow effects
        bgGraphics.lineStyle(2, 0xffffff, 0.15);
        bgGraphics.strokeRoundedRect(
            hudX - textWidth / 2,
            hudY - textHeight / 2,
            textWidth,
            textHeight,
            cornerRadius,
        );

        // Add the main text
        this.factHUD.text = this.add
            .text(hudX, hudY, text, {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#ffffff",
                align: "center",
                fontStyle: "bold",
                wordWrap: { width: textWidth - 80 },
            })
            .setOrigin(0.5);

        // Add all elements to the container
        this.factHUD.container.add(bgGraphics);
        this.factHUD.container.add(this.factHUD.text);

        // Add a subtle glow/pulsing effect
        this.tweens.add({
            targets: this.factHUD.icon,
            scale: { from: 2.5, to: 3 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // Initial state (off-screen)
        this.factHUD.container.setAlpha(0);
        this.factHUD.container.y += 50;

        // Animation sequence
        this.factHUD.tween = this.tweens.chain({
            tweens: [
                {
                    targets: this.factHUD.container,
                    alpha: 1,
                    y: `-=50`,
                    duration: 500,
                    ease: "Back.easeOut",
                },
                {
                    targets: this.factHUD.container,
                    alpha: 0,
                    y: `-=20`,
                    duration: 500,
                    ease: "Power1",
                    delay: 6000, // Display for 6 seconds
                    onComplete: () => {
                        // Clean up after animation
                        if (this.factHUD.container) {
                            this.factHUD.container.destroy();
                            this.factHUD = {
                                container: null,
                                background: null,
                                text: null,
                                icon: null,
                                tween: null,
                            };
                        }
                    },
                },
            ],
        });
    }

    // --- Scene Shutdown ---
    shutdown(): void {
        console.log("Game Scene Shutting Down");

        // Signal scene change through EventBus
        EventBus.emit("scene:changed", "shutdown");

        // Clean up EventBus listeners
        EventBus.off("dpad", this.handleDpadInput, this);
        EventBus.off("game:set-input-active", this.setInputActive, this);

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
