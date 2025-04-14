// src/game/scenes/Game.ts
import * as Phaser from 'phaser';
import EventBus from '../EventBus';
import POLLINATION_FACTS from '../data/pollinationFacts';
import flowerCollectionService from '@/services/FlowerCollectionService';

// Import the new components
import { Bee } from '../entities/Bee';
import { FlowerManager, FlowerData } from '../managers/FlowerManager'; // Import interface too
import { GameTimer } from '../managers/GameTimer';
import { createParticles, addInteractionPulse } from '../utils/effects'; // Import utils

// Keep type alias if needed, or rely on Phaser's types directly
type ArcadePhysicsCallback = Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;

export class Game extends Phaser.Scene {
    // Entities and Managers
    private bee!: Bee; // Now using the Bee class
    private flowers!: Phaser.Physics.Arcade.StaticGroup; // Group managed by FlowerManager
    private flowerManager!: FlowerManager;
    private gameTimer!: GameTimer;

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

    // Config
    private readonly gameDuration: number = 60; // Seconds

    constructor() {
        super('Game');
    }

    create() {
        this.add.image(400, 300, 'background_generated');

        // --- Initialize Managers and Entities ---
        this.flowers = this.physics.add.staticGroup();
        this.flowerManager = new FlowerManager(this, this.flowers);
        this.bee = new Bee(this, 100, this.cameras.main.height / 2); // Create Bee instance

        // --- Flower Setup (using Manager) ---
        this.flowerManager.spawnFlowers(6, 'red');
        this.flowerManager.spawnFlowers(6, 'blue');
        this.flowerManager.assignInitialPollen();

        // --- Physics ---
        this.physics.add.overlap(
            this.bee,
            this.flowers,
            this.handleBeeFlowerCollision as ArcadePhysicsCallback, // Keep collision handler here
            undefined,
            this
        );

        // --- Input ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        } else {
            console.error("Keyboard input plugin not found.");
        }
        EventBus.on('dpad', this.handleDpadInput, this);
        EventBus.on('game:set-input-active', this.setInputActive, this);

        // --- Timer Setup (using Manager) ---
        this.gameTimer = new GameTimer(
            this,
            this.gameDuration,
            (time) => this.events.emit('game:update-timer', time), // Update callback
            () => this.handleTimeUp() // Completion callback
        );

        // --- State Reset ---
        this.resetGameState(); // Encapsulate reset logic

        // --- Start Timer ---
        this.gameTimer.start();

        // --- Initial UI Events ---
        this.events.emit('game:update-score', this.score);
        // Timer manager handles initial emit via its start()

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

    // Called by GameTimer when time is up
    private handleTimeUp(): void {
         if (!this.scene.isActive()) return; // Prevent actions if scene shutting down

        this.inputEnabled = false; // Set flag to disable input logic in update
        // Note: update loop will handle disabling body/velocity

        this.events.emit('game:show-fact', "Time's Up!");

        this.time.delayedCall(1500, () => {
            if (this.scene.isActive()) {
                this.scene.start('GameOver', {
                    score: this.score,
                    completedFlowers: this.completedFlowers,
                    // Calculate elapsed time correctly
                    totalTime: this.gameDuration - this.gameTimer.getRemainingTime(), // Or just pass gameDuration?
                });
            }
        });
    }


    private setInputActive(isActive: boolean): void {
        if (this.inputEnabled === isActive) return;
        this.inputEnabled = isActive;
        const beeBody = this.bee?.body as Phaser.Physics.Arcade.Body | undefined;

        if (!isActive) {
            // --- Disable ---
            // Update loop handles body disable/velocity stop
            this.gameTimer.pause(); // Use timer manager method
            this.dpadState = { up: false, down: false, left: false, right: false };
            // Tell bee to stop animating immediately
            this.bee.stopFlappingAnimation(true);
        } else {
            // --- Enable ---
            // Update loop handles body enable
            this.gameTimer.resume(); // Use timer manager method
            this.input.keyboard?.resetKeys();
            this.dpadState = { up: false, down: false, left: false, right: false };
            // Bee animation will restart on movement in update
        }
    }


    // Handles DPad input events - Remains in Scene
    private handleDpadInput(data: { direction: 'up' | 'down' | 'left' | 'right'; active: boolean }): void {
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
        } else { // Input IS enabled
             if (!beeBody.enable) {
                 beeBody.enable = true; // Re-enable body BEFORE movement processing
             }
             // Delegate movement logic to the Bee entity only if body is enabled
             if (beeBody.enable) {
                 this.bee.updateMovement(this.cursors, this.dpadState, delta);
             } else {
                 console.warn("GAME Update: inputEnabled=TRUE but body is still disabled?");
             }
        }
        // Note: Pollen indicator position update is now handled within bee.updateMovement
    }


    // --- Collision Handling - Remains in Scene ---
    handleBeeFlowerCollision(
        beeGO: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
        flowerGO: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
    ): void {
        // Ensure correct types and that it's *our* bee
        if (!(beeGO instanceof Bee) || !(flowerGO instanceof Phaser.Physics.Arcade.Sprite) || beeGO !== this.bee) {
            return;
        }
        // No need to check inputEnabled/body.enable here - physics system handles that

        const flower = flowerGO;
        const data = flower.getData('flowerData') as FlowerData | undefined;
        if (!data) return;

        // --- Pollen Collection ---
        if (!this.bee.carryingPollenType && data.hasPollen && !data.isPollinated) {
            this.bee.carryingPollenType = data.type; // Update Bee's state
            data.hasPollen = false;
            flower.clearTint();

            // Destroy previous indicator if any (safety check)
            this.pollenIndicator?.destroy();
            this.pollenIndicatorTween?.stop();

            // Create and manage indicator within the Scene
            this.pollenIndicator = this.add.sprite(this.bee.x, this.bee.y - 25, 'pollen_particle_generated')
                .setDepth(11)
                .setTint(data.type === 'red' ? 0xffaaaa : 0xaaaaff)
                .setScale(0).setAlpha(0);

            // Animate indicator appearance
            this.tweens.add({
                targets: this.pollenIndicator,
                scale: 2.5, alpha: 1, duration: 200, ease: 'Power1'
            });
            this.pollenIndicatorTween = this.tweens.add({
                targets: this.pollenIndicator,
                scale: 2.8, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 200
            });

            // Pass indicator reference to the Bee so it can update position
            this.bee.setPollenIndicator(this.pollenIndicator, this.pollenIndicatorTween);

            // Use utility functions for effects
            createParticles(this, flower.x, flower.y, 'pollen_particle_generated', 0xffff00, 15);
            addInteractionPulse(this, flower);
            addInteractionPulse(this, this.bee, 1.05);
        }
        // --- Pollen Delivery ---
        else if (this.bee.carryingPollenType && data.type === this.bee.carryingPollenType && !data.isPollinated && !data.hasPollen) {
            data.isPollinated = true;
            flower.setTint(0x90ee90); // Green tint for pollinated
            this.score += 10;
            this.completedFlowers++;
            this.pollinationCount++;
            this.events.emit('game:update-score', this.score);

            // Destroy pollen indicator visually
            if (this.pollenIndicator) {
                this.pollenIndicatorTween?.stop();
                this.tweens.add({
                    targets: this.pollenIndicator,
                    alpha: 0, scale: 0, duration: 200, ease: 'Power1',
                    onComplete: () => this.pollenIndicator?.destroy()
                });
                 // Clear references
                this.pollenIndicator = null;
                this.pollenIndicatorTween = null;
                this.bee.setPollenIndicator(null, null); // Tell Bee indicator is gone
            }

            this.bee.carryingPollenType = null; // Clear Bee's state

            // Use utility functions for effects
            createParticles(this, flower.x, flower.y, 'pollen_particle_generated', 0x90ee90, 25);
            addInteractionPulse(this, flower);
            addInteractionPulse(this, this.bee, 1.05);

            // --- Fact/Discovery/Win Logic ---
            this.handlePollinationOutcome(data); // Extract complex logic
        }
    }

    // Extracted logic for handling what happens after successful pollination
    private handlePollinationOutcome(pollinatedFlowerData: FlowerData): void {
        const flowerId = pollinatedFlowerData.flowerId;

        if (flowerId) {
             // Use async/await inside an immediately invoked async function (IIFE) or make the calling function async
             (async () => {
                 try {
                     const isNewDiscovery = await flowerCollectionService.discoverFlower(flowerId);
                     let emittedFact = false;
                     let factToEmit = "";

                     if (isNewDiscovery) {
                         this.discoveredFlowerIds.add(flowerId);
                         factToEmit = `New flower type discovered: ${flowerId}!`;
                         emittedFact = true;
                     } else if (this.flowerManager.checkAllPollinated()) { // Use manager method
                         factToEmit = `All flowers pollinated! Great job!`;
                         emittedFact = true;
                         this.endGameDueToCompletion(); // Extracted common logic
                     } else if (this.pollinationCount % this.pollinationFactThreshold === 0) {
                         const randomFact = Phaser.Math.RND.pick(POLLINATION_FACTS);
                         factToEmit = `${this.pollinationCount} flowers pollinated! ${randomFact}`;
                         emittedFact = true;
                     }

                     // Assign more pollen *after* checking win condition
                     if (!this.flowerManager.checkAllPollinated()) {
                          const pollenAdded = this.flowerManager.assignMorePollenIfNeeded();
                          if (pollenAdded) {
                              // Find the flower that just got pollen to add effects
                              const newlyPollenedFlower = (this.flowerManager.getGroup().getChildren() as Phaser.Physics.Arcade.Sprite[]).find(f => {
                                   const fd = f.getData('flowerData') as FlowerData;
                                   return fd.hasPollen && f.tintTopLeft === 0xffff00; // Check tint as indicator
                              });
                              if (newlyPollenedFlower) {
                                  createParticles(this, newlyPollenedFlower.x, newlyPollenedFlower.y, 'pollen_particle_generated', 0xffff00, 10);
                                  addInteractionPulse(this, newlyPollenedFlower);
                              }
                          }
                     }

                     if (emittedFact && factToEmit) {
                         this.events.emit('game:show-fact', factToEmit);
                     }

                 } catch (error) {
                     console.error("Error saving flower discovery:", error);
                     // Simplified fallback logic on error
                     this.handlePollinationErrorFallback();
                 }
             })(); // Immediately invoke the async function
        } else {
             // Handle pollination without flowerId (simpler logic)
             this.handlePollinationErrorFallback(); // Reuse fallback
        }
    }

     // Fallback logic for pollination outcome if error or no flowerId
     private handlePollinationErrorFallback(): void {
         if (this.flowerManager.checkAllPollinated()) {
             this.events.emit('game:show-fact', "All flowers pollinated! Great job!");
             this.endGameDueToCompletion();
         } else {
              if (this.pollinationCount % this.pollinationFactThreshold === 0) {
                  const randomFact = Phaser.Math.RND.pick(POLLINATION_FACTS);
                  this.events.emit('game:show-fact', `${this.pollinationCount} flowers pollinated! ${randomFact}`);
              }
              // Assign more pollen if needed
              const pollenAdded = this.flowerManager.assignMorePollenIfNeeded();
              if (pollenAdded) {
                  // Find the flower that just got pollen to add effects
                  const newlyPollenedFlower = (this.flowerManager.getGroup().getChildren() as Phaser.Physics.Arcade.Sprite[]).find(f => {
                       const fd = f.getData('flowerData') as FlowerData;
                       return fd.hasPollen && f.tintTopLeft === 0xffff00; // Check tint as indicator
                  });
                  if (newlyPollenedFlower) {
                      createParticles(this, newlyPollenedFlower.x, newlyPollenedFlower.y, 'pollen_particle_generated', 0xffff00, 10);
                      addInteractionPulse(this, newlyPollenedFlower);
                  }
              }
         }
     }

     // Common logic for ending the game when all flowers are done
     private endGameDueToCompletion(): void {
         if (!this.scene.isActive()) return;
         this.inputEnabled = false; // Prevent further input
         this.gameTimer.pause(); // Stop timer visually
         // Update loop will disable body etc.
         this.time.delayedCall(500, () => { // Short delay after "All pollinated" message
             if (this.scene.isActive()) {
                  this.scene.start('GameOver', {
                     score: this.score,
                     completedFlowers: this.completedFlowers,
                     totalTime: this.gameDuration - this.gameTimer.getRemainingTime()
                 });
             }
         });
     }


    // --- Scene Shutdown ---
    shutdown(): void {
        console.log("Game Scene Shutting Down");
        // Clean up EventBus listeners
        EventBus.off('dpad', this.handleDpadInput, this);
        EventBus.off('game:set-input-active', this.setInputActive, this);

        // Clean up managers and entities THAT ARE NOT AUTOMATICALLY DESTROYED BY PHASER
        // Phaser handles destroying scene-added game objects (like the Bee sprite)
        // and scene systems (like tweens, time events added directly to the scene)
        this.gameTimer?.destroy(); // Important: Stop the timer's internal Phaser timer event

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
