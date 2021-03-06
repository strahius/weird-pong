import * as constants from "../constants";
import { SpriteManager } from "../sprite/SpriteManager";
import { spillParticles } from "../particles";

const EMITTER_OFFSET = 24;
const MULTI = 1.3;

export class Fountain {
  constructor(scene, owner) {
    this.owner = owner;
    let balls = [...SpriteManager.GetBalls(), SpriteManager.GetPlayer()];
    balls = balls.filter((ball) => ball !== undefined);

    const source = {
      contains: (x, y): void => {
        const ball = balls.filter((ball) => {
          return scene.matter.containsPoint(ball.body, x, y);
        })[0];
        if (ball) {
          const angle = owner.angle - 90;
          const rotation = Phaser.Math.DegToRad(angle);
          const speed = 0.017;
          const beerVelocity = new Phaser.Math.Vector2(
            Math.cos(rotation) * speed,
            Math.sin(rotation) * speed
          );
          const ballVelocity = new Phaser.Math.Vector2(
            ball.body.velocity.x,
            ball.body.velocity.y
          );
          const newVelocity = ballVelocity.add(beerVelocity);
          ball.setVelocity(newVelocity.x, newVelocity.y);

          const fountainCollidedAt = ball.getData("fountain_collided_at");
          const fountainDuration = ball.getData("fountain_duration") || 0;
          const now = new Date();
          const timeDiff = now - fountainCollidedAt;
          let newDuration = 0;

          if (timeDiff < constants.FOUNTAIN_TIME_DIFF) {
            newDuration = fountainDuration + timeDiff;
          }

          ball.setData("fountain_collided_at", now);
          ball.setData("fountain_duration", newDuration);
        }
      },
    };

    this.emitter = spillParticles.createEmitter({
      alpha: { start: 1, end: 0, ease: "Quint.easeIn" },
      speed: { min: 200 * MULTI, max: 300 * MULTI },
      accelerationY: 500,
      lifespan: { min: 500, max: 700 },
      quantity: 20,
      on: false,
      follow: owner,
      deathZone: { type: "onEnter", source: source },
    });
    this.emitter.setFrame(["drop_dark", "drop_light"]);

    const angle = owner.angle - 90;
    this.emitter.setAngle({
      min: angle - EMITTER_OFFSET,
      max: angle + EMITTER_OFFSET,
    });

    this.emitter.start();
  }

  update(): void {
    const angle = this.owner.angle - 90;
    this.emitter.setAngle({
      min: angle - EMITTER_OFFSET,
      max: angle + EMITTER_OFFSET,
    });
  }
}
