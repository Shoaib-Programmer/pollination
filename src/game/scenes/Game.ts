// src/game/scenes/Game.ts
import Phaser, { Scene } from "phaser";
import EventBus from "../EventBus"; // Import EventBus for DPad and input control
import gsap from "gsap"; // Import GSAP for animations

// Define an interface for Flower data
interface FlowerData {
    type: "red" | "blue";
    hasPollen: boolean;
    isPollinated: boolean;
}

// Define ArcadePhysicsCallback type alias
type ArcadePhysicsCallback = Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;

export class Game extends Scene {
    private bee!: Phaser.Physics.Arcade.Sprite;
    private flowers!: Phaser.Physics.Arcade.StaticGroup;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private score: number = 0;
    private facts: string[] = [
        "Bees are responsible for pollinating about 1/3 of the food we eat!",
        "Some flowers only open at night for nocturnal pollinators like moths and bats.",
        "Honeybees communicate flower locations using a 'waggle dance'.",
        "Not all bees make honey! Many bee species are solitary.",
        "Pollinators include bees, butterflies, moths, beetles, flies, birds, and bats.",
        "Without pollination, many plants cannot produce fruits or seeds.",
        "Some plants trick insects into pollinating them without offering nectar.",
        "Wind and water can also be pollinators for certain plants like grasses and oaks.",
        "Climate change can disrupt the timing between flower blooming and pollinator activity.",
        "Planting native flowers helps support local pollinator populations.",
        "A single bee colony can pollinate 300 million flowers each day.",
        "Flowers have specific colors and scents to attract their preferred pollinators.",
    ];
    private carryingPollen: { type: "red" | "blue" | null } = { type: null };
    private pollenIndicator!: Phaser.GameObjects.Sprite | null;
    private pollenIndicatorTween: Phaser.Tweens.Tween | null = null;
    private wingFlapTween: gsap.core.Tween | null = null; // GSAP tween for wings

    // DPad state for mobile controls
    private dpadState = { up: false, down: false, left: false, right: false };
    private isMoving: boolean = false; // Track movement state for wing animation

    // Flag to control player input
    private inputEnabled: boolean = true;

    constructor() {
        super("Game");
    }

    create() {
        this.add.image(400, 300, "background_generated");

        // --- Bee Setup ---
        this.bee = this.physics.add.sprite(
            100,
            this.cameras.main.height / 2,
            "bee_generated"
        );
        this.bee.setCollideWorldBounds(true).setBounce(0.1).setDepth(10);
        this.bee
            .setBodySize(this.bee.width * 0.8, this.bee.height * 0.8)
            .setOrigin(0.5, 0.5); // Center origin for scaleY animation
        this.bee.setScale(0).setAlpha(0); // Start invisible/small for entrance

        // Bee Entrance Animation (Phaser Tween)
        this.tweens.add({
            targets: this.bee,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: "Power2",
            delay: 200,
            onComplete: () => {
                if (this.bee?.active) {
                    this.startWingFlapAnimation();
                }
            },
        });

        // --- Flower Setup ---
        this.flowers = this.physics.add.staticGroup();
        this.spawnFlowers(6, "red");
        this.spawnFlowers(6, "blue");
        this.assignInitialPollen();

        // --- Input Setup ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        } else {
            console.error("Keyboard input plugin not found."); // Keep this important error
        }
        // Listen for DPad and input control events from the EventBus
        EventBus.on("dpad", this.handleDpadInput, this);
        EventBus.on("game:set-input-active", this.setInputActive, this);

        // --- Physics Setup ---
        this.physics.add.overlap(
            this.bee,
            this.flowers,
            this.handleBeeFlowerCollision as ArcadePhysicsCallback,
            undefined,
            this
        );

        // --- State Reset ---
        this.score = 0;
        this.carryingPollen.type = null;
        this.pollenIndicator = null;
        this.pollenIndicatorTween = null;
        this.wingFlapTween = null;
        this.isMoving = false;
        this.inputEnabled = true; // Ensure input starts enabled

        // --- Emit Initial UI Events ---
        this.events.emit("game:update-score", this.score);
        this.events.emit(
            "game:show-fact",
            "Fly to a glowing flower (yellow tint) to collect pollen!"
        );

        // --- Scene Cleanup Logic ---
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            // Remove EventBus listeners
            EventBus.off("dpad", this.handleDpadInput, this);
            EventBus.off("game:set-input-active", this.setInputActive, this);

            // Clean up GSAP tweens
            this.wingFlapTween?.kill();
            this.wingFlapTween = null;
            gsap.killTweensOf(this.bee);

            // Clean up Phaser tweens
            this.pollenIndicatorTween?.stop();
            this.pollenIndicatorTween = null;
        });
    }

    // --- Method to enable/disable player input ---
    private setInputActive(isActive: boolean) {
        this.inputEnabled = isActive;
        if (!isActive) {
            // Immediately stop the bee if input is disabled
            this.bee?.setVelocity(0);
        }
    }

    // Handles DPad input events from the EventBus
    private handleDpadInput(data: {
        direction: "up" | "down" | "left" | "right";
        active: boolean;
    }) {
        if (data.direction in this.dpadState) {
            this.dpadState[data.direction] = data.active;
        }
    }

    // Sets up the GSAP wing flap animation
    private startWingFlapAnimation() {
        if (this.wingFlapTween || !this.bee?.active) return;

        const targetScaleY = 0.8;
        const flapDuration = 0.1;

        this.bee.setScale(this.bee.scaleX, 1);

        this.wingFlapTween = gsap.to(this.bee, {
            scaleY: targetScaleY,
            duration: flapDuration,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            paused: true, // Start paused
            overwrite: true,
        });
    }

    // Main game loop update method
    update(time: number, delta: number) {
        // Only handle movement if input is enabled
        if (this.inputEnabled) {
            this.handlePlayerMovement(delta);
        }
        // Always update indicator position
        this.updatePollenIndicatorPosition();
    }

    // Assigns pollen to a random subset of flowers initially
    assignInitialPollen() {
        const flowerChildren =
            this.flowers.getChildren() as Phaser.Physics.Arcade.Sprite[];
        Phaser.Utils.Array.Shuffle(flowerChildren);
        let pollenCount = 0;
        const maxPollen = Math.ceil(flowerChildren.length / 2);

        for (const flower of flowerChildren) {
            if (pollenCount >= maxPollen) break;
            const data = flower?.getData("flowerData") as
                | FlowerData
                | undefined;
            if (data && !data.isPollinated && !data.hasPollen) {
                data.hasPollen = true;
                flower.setTint(0xffff00); // Yellow tint indicates pollen
                pollenCount++;
            }
        }
    }

    // Creates multiple flowers of a specific type
    spawnFlowers(count: number, type: "red" | "blue") {
        const texture = `flower_${type}_generated`;
        const margin = 60;
        const spacing = 80;
        const maxAttempts = 20;

        for (let i = 0; i < count; i++) {
            let x: number,
                y: number,
                validPosition: boolean,
                attempts: number = 0;

            // Find a valid position
            do {
                validPosition = true;
                x = Phaser.Math.Between(
                    margin,
                    this.cameras.main.width - margin
                );
                y = Phaser.Math.Between(
                    margin + 60,
                    this.cameras.main.height - margin
                );

                this.flowers.children.iterate((existingFlower) => {
                    if (!existingFlower) return true;
                    const sprite =
                        existingFlower as Phaser.Physics.Arcade.Sprite;
                    if (
                        Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y) <
                        spacing
                    ) {
                        validPosition = false;
                        return false;
                    }
                    return true;
                });
                attempts++;
                if (attempts > maxAttempts) {
                    console.warn(
                        `Could not find valid position for flower ${
                            i + 1
                        } of type ${type}`
                    );
                    break;
                }
            } while (!validPosition);

            // Create flower if position found
            if (validPosition) {
                const flower = this.flowers.create(x, y, texture);
                if (flower) {
                    flower.setData("flowerData", {
                        type,
                        hasPollen: false,
                        isPollinated: false,
                    } as FlowerData);
                    const bodyRadius = flower.width * 0.35;
                    flower
                        .setCircle(bodyRadius)
                        .setOffset(
                            flower.width / 2 - bodyRadius,
                            flower.height / 2 - bodyRadius
                        )
                        .refreshBody();

                    // Entrance Animation
                    flower.setScale(0).setAlpha(0);
                    this.tweens.add({
                        targets: flower,
                        scale: 1,
                        alpha: 1,
                        duration: 300,
                        ease: "Back.easeOut",
                        delay: i * 50 + 300,
                    });
                }
            }
        }
    }

    // Handles player movement based on keyboard and DPad input
    handlePlayerMovement(delta: number) {
        // Guard clause: Respect inputEnabled flag
        if (!this.inputEnabled) {
            this.bee?.setVelocity(0); // Ensure bee is stopped if called unexpectedly
            return;
        }

        if (!this.bee?.body) return; // Guard clause for bee existence

        const speed = 250;
        let moveX = 0;
        let moveY = 0;

        // Combine keyboard and DPad inputs
        const leftPressed = this.cursors?.left.isDown || this.dpadState.left;
        const rightPressed = this.cursors?.right.isDown || this.dpadState.right;
        const upPressed = this.cursors?.up.isDown || this.dpadState.up;
        const downPressed = this.cursors?.down.isDown || this.dpadState.down;

        if (leftPressed) moveX = -1;
        else if (rightPressed) moveX = 1;
        if (upPressed) moveY = -1;
        else if (downPressed) moveY = 1;

        // Apply velocity
        const moveVector = new Phaser.Math.Vector2(moveX, moveY).normalize();
        this.bee.setVelocity(moveVector.x * speed, moveVector.y * speed);

        // Flip sprite
        if (moveX < 0) this.bee.setFlipX(true);
        else if (moveX > 0) this.bee.setFlipX(false);

        // Control Wing Flap Animation
        const isCurrentlyMoving = moveVector.length() > 0;
        if (this.wingFlapTween) {
            if (isCurrentlyMoving && !this.isMoving) {
                gsap.killTweensOf(this.bee, "scaleY");
                if (this.wingFlapTween.paused()) this.wingFlapTween.play();
            } else if (!isCurrentlyMoving && this.isMoving) {
                this.wingFlapTween.pause();
                gsap.to(this.bee, {
                    scaleY: 1,
                    duration: 0.1,
                    ease: "power1.out",
                    overwrite: true,
                });
            }
        }
        this.isMoving = isCurrentlyMoving;
    }

    // Handles collision between the bee and flowers
    handleBeeFlowerCollision(
        beeGO:
            | Phaser.Types.Physics.Arcade.GameObjectWithBody
            | Phaser.Tilemaps.Tile,
        flowerGO:
            | Phaser.Types.Physics.Arcade.GameObjectWithBody
            | Phaser.Tilemaps.Tile
    ) {
        if (
            !(beeGO instanceof Phaser.Physics.Arcade.Sprite) ||
            !(flowerGO instanceof Phaser.Physics.Arcade.Sprite)
        )
            return;
        const flower = flowerGO;
        const data = flower.getData("flowerData") as FlowerData | undefined;
        if (!data) return;

        // --- Pollen Collection Logic ---
        if (!this.carryingPollen.type && data.hasPollen && !data.isPollinated) {
            this.carryingPollen.type = data.type;
            data.hasPollen = false;
            flower.clearTint();

            this.pollenIndicatorTween?.stop();
            this.pollenIndicator?.destroy();
            this.pollenIndicator = this.add
                .sprite(
                    this.bee.x,
                    this.bee.y - 25,
                    "pollen_particle_generated"
                )
                .setDepth(11)
                .setTint(data.type === "red" ? 0xffaaaa : 0xaaaaff)
                .setScale(0)
                .setAlpha(0);

            this.createParticles(
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0xffff00,
                15
            );
            this.events.emit(
                "game:show-fact",
                `Collected ${data.type} pollen! Find another ${data.type} flower.`
            );
            this.addInteractionPulse(flower);
            this.addInteractionPulse(this.bee, 1.05);

            if (this.pollenIndicator) {
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
            }
        }
        // --- Pollen Delivery Logic ---
        else if (
            this.carryingPollen.type &&
            data.type === this.carryingPollen.type &&
            !data.isPollinated &&
            !data.hasPollen
        ) {
            data.isPollinated = true;
            flower.setTint(0x90ee90);
            this.score += 10;
            this.events.emit("game:update-score", this.score);

            const randomFact = Phaser.Math.RND.pick(this.facts);
            this.events.emit("game:show-fact", `Pollinated! ${randomFact}`);

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
                this.pollenIndicator = null;
                this.pollenIndicatorTween = null;
            }
            this.carryingPollen.type = null;

            this.createParticles(
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0x90ee90,
                25
            );
            this.addInteractionPulse(flower);
            this.addInteractionPulse(this.bee, 1.05);

            if (this.checkAllPollinated()) {
                this.events.emit(
                    "game:show-fact",
                    `All flowers pollinated! Great job!`
                );
                this.inputEnabled = false; // Disable input before transitioning
                this.bee.setVelocity(0); // Stop bee
                this.time.delayedCall(1500, () => {
                    this.scene.start("GameOver", { score: this.score });
                });
            } else {
                this.assignMorePollenIfNeeded();
            }
        }
    }

    // Creates a brief scale pulse animation on a target sprite
    addInteractionPulse(
        target: Phaser.GameObjects.Sprite,
        scaleAmount: number = 1.15
    ) {
        if (!target?.active) return;
        const startScaleX = target.scaleX;
        const startScaleY = target.scaleY;
        this.tweens.killTweensOf(target);
        this.tweens.add({
            targets: target,
            scaleX: startScaleX * scaleAmount,
            scaleY: startScaleY * scaleAmount,
            duration: 120,
            yoyo: true,
            ease: "Sine.easeInOut",
        });
    }

    // Checks if more pollen needs to be added to the field
    assignMorePollenIfNeeded() {
        let pollenAvailable = false;
        this.flowers.children.iterate((child) => {
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower?.getData("flowerData") as
                | FlowerData
                | undefined;
            if (data?.hasPollen && !data.isPollinated) {
                pollenAvailable = true;
                return false; // Found one, stop checking
            }
            return true;
        });

        if (!pollenAvailable) {
            const unpollinatedFlowers = (
                this.flowers.getChildren() as Phaser.Physics.Arcade.Sprite[]
            ).filter((f) => {
                const data = f?.getData("flowerData") as FlowerData | undefined;
                return data && !data.isPollinated && !data.hasPollen;
            });

            if (unpollinatedFlowers.length > 0) {
                const flowerToAddPollen =
                    Phaser.Math.RND.pick(unpollinatedFlowers);
                const data = flowerToAddPollen?.getData("flowerData") as
                    | FlowerData
                    | undefined;
                if (data) {
                    // No need to check flowerToAddPollen again
                    data.hasPollen = true;
                    flowerToAddPollen.setTint(0xffff00);
                    this.createParticles(
                        flowerToAddPollen.x,
                        flowerToAddPollen.y,
                        "pollen_particle_generated",
                        0xffff00,
                        10
                    );
                    this.events.emit(
                        "game:show-fact",
                        "More pollen has appeared!"
                    );
                    this.addInteractionPulse(flowerToAddPollen);
                }
            }
        }
    }

    // Keeps the pollen indicator positioned above the bee
    updatePollenIndicatorPosition() {
        if (this.pollenIndicator && this.bee?.body) {
            this.pollenIndicator.setPosition(this.bee.x, this.bee.y - 25);
        }
    }

    // Utility function to create particle explosions
    createParticles(
        x: number,
        y: number,
        texture: string,
        tint: number,
        count: number = 10
    ) {
        if (!this.textures.exists(texture)) return;
        const particles = this.add.particles(x, y, texture, {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: { min: 300, max: 600 },
            gravityY: 80,
            blendMode: "ADD",
            tint: tint,
            emitting: false,
        });

        if (particles) {
            particles.explode(count);
            this.time.delayedCall(1500, () => {
                particles?.destroy();
            }); // Use optional chaining
        }
    }

    // Checks if all flowers in the scene have been pollinated
    checkAllPollinated(): boolean {
        // Use the 'every' method for a more concise check
        return this.flowers.getChildren().every((child) => {
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower?.getData("flowerData") as
                | FlowerData
                | undefined;
            return data?.isPollinated === true; // Return true only if pollinated
        });
    }
}

