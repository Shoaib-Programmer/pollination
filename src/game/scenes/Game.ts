// src/game/scenes/Game.ts
import Phaser, { Scene } from "phaser";
import EventBus from "../EventBus"; // Import EventBus to LISTEN for DPad
import gsap from "gsap"; // Import GSAP

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
        /* Fact strings... */
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

    // DPad state
    private dpadState = { up: false, down: false, left: false, right: false };

    constructor() {
        super("Game");
    }

    create() {
        this.add.image(400, 300, "background_generated");

        // Bee - Add slight scale-in entrance using Phaser Tweens
        this.bee = this.physics.add.sprite(
            100,
            this.cameras.main.height / 2,
            "bee_generated"
        );
        this.bee.setCollideWorldBounds(true).setBounce(0.1).setDepth(10);
        this.bee
            .setBodySize(this.bee.width * 0.8, this.bee.height * 0.8)
            .setOrigin(0.5, 0.5);
        this.bee.setScale(0).setAlpha(0); // Start invisible and small

        // Bee Entrance Tween (Phaser)
        this.tweens.add({
            targets: this.bee,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: "Power2",
            delay: 200,
            onComplete: () => {
                // --- Start Wing Flap AFTER entrance ---
                if (this.bee?.active) {
                    // Ensure bee still exists
                    this.startWingFlapAnimation();
                }
                // ------------------------------------
            },
        });

        // --- Flowers ---
        this.flowers = this.physics.add.staticGroup();
        this.spawnFlowers(6, "red"); // Spawn AFTER group is created
        this.spawnFlowers(6, "blue");
        this.assignInitialPollen(); // Assign pollen AFTER flowers are spawned

        // --- Input ---
        if (this.input && this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        } else {
            console.error("Keyboard input plugin not found.");
        }

        // --- Physics ---
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
        this.wingFlapTween = null; // Init wing flap tween state

        // --- Initial UI Events (Internal) ---
        this.events.emit("game:update-score", this.score);
        this.events.emit(
            "game:show-fact",
            "Fly to a glowing flower (yellow tint) to collect pollen!"
        );

        // --- DPad Listener ---
        EventBus.on("dpad", this.handleDpadInput, this);

        // --- Cleanup Listeners ---
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            console.log(
                "Game scene shutdown: Cleaning up listeners and tweens."
            );
            EventBus.off("dpad", this.handleDpadInput, this);
            // Stop GSAP wing flap tween
            if (this.wingFlapTween) {
                this.wingFlapTween.kill();
                this.wingFlapTween = null;
            }
            // Stop Phaser pollen indicator tween
            if (this.pollenIndicatorTween) {
                this.pollenIndicatorTween.stop();
                this.pollenIndicatorTween = null;
            }
        });

        // --- Scene Ready Signal ---
        this.events.emit("scene-ready", this);
        console.log("Game scene emitted scene-ready");
    }

    // --- DPad Input Handler ---
    private handleDpadInput(data: {
        direction: "up" | "down" | "left" | "right";
        active: boolean;
    }) {
        if (data.direction in this.dpadState) {
            this.dpadState[data.direction] = data.active;
        }
    }

    // --- Wing Flap Animation ---
    private startWingFlapAnimation() {
        if (this.wingFlapTween) {
            // Kill existing tween if any
            this.wingFlapTween.kill();
        }
        // Use GSAP to animate scaleY for flapping effect
        this.wingFlapTween = gsap.to(this.bee, {
            scaleY: 0.85, // How much to squash vertically
            duration: 0.15, // Speed of one flap (down or up)
            repeat: -1, // Repeat forever
            yoyo: true, // Animate back to original scaleY
            ease: "sine.inOut", // Smooth easing
            overwrite: true, // Overwrite previous scaleY tweens if necessary
        });
        console.log("Started wing flap animation.");
    }

    // --- Update Loop ---
    update(time: number, delta: number) {
        this.handlePlayerMovement(delta);
        this.updatePollenIndicatorPosition();
    }

    // --- assignInitialPollen (RESTORED LOGIC) ---
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
            if (flower && data && !data.isPollinated && !data.hasPollen) {
                data.hasPollen = true;
                flower.setTint(0xffff00); // Apply bright yellow tint
                pollenCount++;
            }
        }
        console.log(`Assigned initial pollen to ${pollenCount} flowers.`);
    }

    // --- spawnFlowers (RESTORED POSITION LOGIC) ---
    spawnFlowers(count: number, type: "red" | "blue") {
        const texture = `flower_${type}_generated`;
        const margin = 60,
            spacing = 80,
            maxAttempts = 20;

        for (let i = 0; i < count; i++) {
            let x: number,
                y: number,
                validPosition: boolean,
                attempts: number = 0;
            do {
                // --- RESTORED POSITION FINDING ---
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
                // --- END RESTORED POSITION FINDING ---
                attempts++;
                if (attempts > maxAttempts) {
                    console.warn(
                        `Could not place flower ${type} #${
                            i + 1
                        } after ${maxAttempts} attempts.`
                    );
                    break; // Give up placing this flower if too crowded
                }
            } while (!validPosition);

            if (validPosition) {
                const flower = this.flowers.create(x, y, texture);
                if (flower) {
                    flower.setData("flowerData", {
                        type: type,
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

                    // Spawn Animation (Phaser Tween)
                    flower.setScale(0).setAlpha(0);
                    this.tweens.add({
                        targets: flower,
                        scale: 1,
                        alpha: 1,
                        duration: 300,
                        ease: "Back.easeOut", // Use a nice "pop" easing
                        delay: i * 50 + 300, // Stagger delay slightly after bee entrance
                    });
                }
            }
        }
    }

    // --- handlePlayerMovement (Includes DPad check) ---
    handlePlayerMovement(delta: number) {
        if (!this.bee?.body) return;
        const speed = 250;
        this.bee.setVelocity(0);
        let moveX = 0,
            moveY = 0;

        const leftPressed = this.cursors?.left.isDown || this.dpadState.left;
        const rightPressed = this.cursors?.right.isDown || this.dpadState.right;
        const upPressed = this.cursors?.up.isDown || this.dpadState.up;
        const downPressed = this.cursors?.down.isDown || this.dpadState.down;

        if (leftPressed) moveX = -1;
        else if (rightPressed) moveX = 1;
        if (upPressed) moveY = -1;
        else if (downPressed) moveY = 1;

        const moveVector = new Phaser.Math.Vector2(moveX, moveY);
        if (moveVector.length() > 0) moveVector.normalize();
        this.bee.setVelocity(moveVector.x * speed, moveVector.y * speed);

        if (moveX < 0) this.bee.setFlipX(true);
        else if (moveX > 0) this.bee.setFlipX(false);

        // --- Pause/Resume Wing Flap based on movement ---
        if (moveX !== 0 || moveY !== 0) {
            if (this.wingFlapTween && !this.wingFlapTween.isActive()) {
                this.wingFlapTween.play(); // Resume flapping if moving
            }
        } else {
            if (this.wingFlapTween && this.wingFlapTween.isActive()) {
                // Optional: Smoothly go back to neutral scaleY when stopping
                gsap.to(this.bee, {
                    scaleY: 1,
                    duration: 0.1,
                    overwrite: true,
                    onComplete: () => {
                        this.wingFlapTween?.pause();
                        return void 0;
                    },
                });
                // Or just pause immediately:
                // this.wingFlapTween.pause();
            }
        }
        // --- End Pause/Resume Wing Flap ---
    }

    // --- handleBeeFlowerCollision (With Animated Pollen Indicator) ---
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
        const bee = beeGO as Phaser.Physics.Arcade.Sprite,
            flower = flowerGO as Phaser.Physics.Arcade.Sprite;
        const data = flower.getData("flowerData") as FlowerData | undefined;
        if (!data) return;

        // Collection
        if (!this.carryingPollen.type && data.hasPollen && !data.isPollinated) {
            this.carryingPollen.type = data.type;
            data.hasPollen = false;
            flower.clearTint();

            // Stop/destroy previous indicator/tweens
            if (this.pollenIndicatorTween) this.pollenIndicatorTween.stop();
            if (this.pollenIndicator) this.pollenIndicator.destroy();

            // Create new indicator
            this.pollenIndicator = this.add
                .sprite(
                    this.bee.x,
                    this.bee.y - 25,
                    "pollen_particle_generated"
                )
                .setDepth(11)
                .setTint(data.type === "red" ? 0xffaaaa : 0xaaaaff)
                .setScale(0)
                .setAlpha(0); // Start hidden for animation

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

            // Animate Pollen Indicator In and Pulse (Phaser Tweens)
            if (this.pollenIndicator) {
                this.tweens.add({
                    // Entrance tween
                    targets: this.pollenIndicator,
                    scale: 2.5,
                    alpha: 1,
                    duration: 200,
                    ease: "Power1",
                });
                this.pollenIndicatorTween = this.tweens.add({
                    // Pulse tween
                    targets: this.pollenIndicator,
                    scale: 2.8,
                    duration: 400,
                    yoyo: true,
                    repeat: -1,
                    ease: "Sine.easeInOut",
                    delay: 200, // Start pulsing slightly after entrance
                });
            }
        }
        // Delivery
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

            // Stop pollen indicator pulsing and fade out (Phaser Tween)
            if (this.pollenIndicator) {
                if (this.pollenIndicatorTween) this.pollenIndicatorTween.stop(); // Stop pulsing
                this.tweens.add({
                    targets: this.pollenIndicator,
                    alpha: 0,
                    scale: 0,
                    duration: 200,
                    ease: "Power1",
                    onComplete: () => this.pollenIndicator?.destroy(), // Use optional chaining
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
                this.time.delayedCall(1500, () => {
                    this.scene.start("GameOver", { score: this.score });
                });
            } else {
                this.assignMorePollenIfNeeded();
            }
        }
    }

    // --- addInteractionPulse (With safety check) ---
    addInteractionPulse(
        target: Phaser.GameObjects.Sprite,
        scaleAmount: number = 1.15
    ) {
        if (!target || !target.active) return; // Check target validity
        const startScale = target.scale;
        this.tweens.killTweensOf(target); // Kill existing scale tweens
        this.tweens.add({
            targets: target,
            scale: startScale * scaleAmount,
            duration: 120,
            yoyo: true,
            ease: "Sine.easeInOut",
            onComplete: () => {
                if (target.active) target.setScale(startScale);
            }, // Reset scale robustly
        });
    }

    // --- assignMorePollenIfNeeded (RESTORED LOGIC + Pulse) ---
    assignMorePollenIfNeeded() {
        let pollenAvailable = false;
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower.getData("flowerData") as FlowerData | undefined;
            if (data?.hasPollen && !data.isPollinated) {
                pollenAvailable = true;
                return false;
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
                if (data && flowerToAddPollen) {
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
                    this.addInteractionPulse(flowerToAddPollen); // Pulse the newly available flower
                }
            }
        }
    }

    // --- updatePollenIndicatorPosition ---
    updatePollenIndicatorPosition() {
        if (this.pollenIndicator && this.bee?.body) {
            this.pollenIndicator.setPosition(this.bee.x, this.bee.y - 25);
        }
    }

    // --- createParticles Method ---
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
                if (particles.active) particles.destroy();
            });
        }
    }

    // --- checkAllPollinated Method ---
    checkAllPollinated(): boolean {
        let allDone = true;
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower.getData("flowerData") as FlowerData | undefined;
            if (!data || !data.isPollinated) {
                allDone = false;
                return false;
            }
            return true;
        });
        return allDone;
    }
}
