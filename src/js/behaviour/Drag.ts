import ProjectionLine from "../component/ProjectionLine";
import PointsTrace from "../component/PointsTrace";
import { OwnerTrace } from "../component/OwnerTrace";
import * as constants from "../constants";
import { isInCircle, closestPointToCircle } from "../utils";

const SPEED = 0.15;
const RESET_DISTANCE = 650;
const IMMOBILE_SPEED = 0.2222222222229;
const IMMOBILE_ANGULAR_SPPED = 0.03;
const GREY_BALL_SCALE = 1.6;
const DEATH_DELAY = 650;
const DRAG_RADIUS = 95;

export class Drag {
  constructor(scene, owner, x, y, frame, angleRad) {
    this.owner = owner;
    owner.touchesTable = false;
    owner.hasConstraint = false;
    owner.isDead = false;
    owner.launched = false;

    owner.startPos = { x, y };

    owner.isPressed = false;
    owner.dragX = x;
    owner.dragY = y;
    owner.angleRad = angleRad;

    owner.setInteractive({ draggable: true });

    // TODO: REMOVE grey asseets
    const greyBall = scene.add.image(x, y, constants.TEXTURE_ATLAS, frame);
    greyBall.setScale(GREY_BALL_SCALE);
    greyBall.setAlpha(0.07);
    greyBall.tint = "#d9d9d9";

    ((): void =>
      new ProjectionLine(scene, x, y, SPEED, 100, greyBall, owner))();

    owner.pointsTrace = new PointsTrace(scene, owner, greyBall, owner);
    owner.ballTrace = new OwnerTrace(scene, owner, frame);

    owner.constraint = Phaser.Physics.Matter.Matter.Constraint.create({
      pointA: { x, y },
      bodyB: owner.body,
      stiffness: 0.05,
    });
    owner.setStatic(true);

    const ballIds = owner.body.parts.map((part) => part.id);

    scene.input.on("dragstart", (pointer, gameObject) => {
      gameObject.isPressed = true;
      gameObject.launched = false;
      gameObject.dragX = gameObject.x;
      gameObject.dragY = gameObject.y;

      if (gameObject.hasConstraint) {
        gameObject.scene.matter.world.removeConstraint(gameObject.constraint);
      }
      gameObject.setStatic(false);
    });

    scene.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      gameObject.isPressed = true;
      let pointX = dragX;
      let pointY = dragY;

      if (!isInCircle(x, y, dragX, dragY, DRAG_RADIUS)) {
        const position = closestPointToCircle(x, y, dragX, dragY, DRAG_RADIUS);
        pointX = position.x;
        pointY = position.y;
      }

      gameObject.dragX = pointX;
      gameObject.dragY = pointY;
    });

    scene.input.on("dragend", (pointer, gameObject) => {
      gameObject.isPressed = false;
      gameObject.launched = true;

      if (
        Phaser.Geom.Rectangle.ContainsRect(
          greyBall.getBounds(),
          owner.getBounds()
        )
      ) {
        gameObject.scene.matter.world.add(gameObject.constraint);
        gameObject.hasConstraint = true;
        return;
      }

      gameObject.setStatic(false);
      gameObject.setVelocity(
        (gameObject.startPos.x - gameObject.x) * SPEED,
        (gameObject.startPos.y - gameObject.y) * SPEED
      );

      gameObject.removeInteractive();
    });

    scene.matter.world.on("collisionstart", (event, bodyA, bodyB) => {
      if (owner.isDead || !owner.launched) {
        return;
      }

      if (
        [bodyA.id, bodyB.id].some((r) => ballIds.includes(r)) &&
        [bodyA.id, bodyB.id].some((r) => owner.scene.tableIds.includes(r))
      ) {
        owner.scene.sound.play("table_bounce");
        owner.touchesTable = true;
      }

      const { pairs } = event;
      for (let i = 0; i < pairs.length; i += 1) {
        //  We only want sensor collisions
        if (pairs[i].isSensor) {
          if (ballIds.includes(bodyA.id)) {
            owner.destroy();
            owner.isDead = true;
          }
        }
      }
    });

    scene.matter.world.on("collisionend", (event, bodyA, bodyB) => {
      if (owner.isDead || !owner.launched) {
        return;
      }

      if (
        !isInCircle(
          x,
          y,
          owner.body.position.x,
          owner.body.position.y,
          DRAG_RADIUS
        )
      ) {
        if (
          [bodyA.id, bodyB.id].some((r) => ballIds.includes(r)) &&
          [bodyA.id, bodyB.id].some((r) => owner.scene.tableIds.includes(r))
        ) {
          owner.touchesTable = false;
        }
      }
    });
  }

  update(): void {
    if (this.owner.isDead || this.owner.livesNumber === 0) {
      return;
    }

    // Workaround for bug where when ball is clicked on the edge, it falls down
    if (this.owner.isPressed) {
      this.owner.x = this.owner.dragX;
      this.owner.y = this.owner.dragY;
    }

    const isImmobile =
      this.owner.body.speed < IMMOBILE_SPEED &&
      this.owner.body.angularSpeed < IMMOBILE_ANGULAR_SPPED &&
      this.owner.touchesTable;
    if (
      Phaser.Math.Distance.Between(
        this.owner.x,
        this.owner.y,
        this.owner.scene.cup.x,
        this.owner.scene.cup.y
      ) > RESET_DISTANCE ||
      isImmobile
    ) {
      this.owner.isDead = true;
      this.owner.scene.time.delayedCall(DEATH_DELAY, this.kill, null, this);
    }

    this.owner.pointsTrace.update();
    this.owner.ballTrace.update();
  }

  kill(): void {
    this.owner.livesNumber -= 1;
    this.owner.emit("dead");
    if (this.owner.livesNumber !== 0) {
      this.reset();
    }
    this.owner.isDead = false;
  }

  reset(): void {
    this.owner.setInteractive({ draggable: true });

    this.owner.touchesTable = false;

    this.owner.setStatic(true);
    this.owner.x = this.owner.startPos.x;
    this.owner.y = this.owner.startPos.y;
    this.owner.rotation = this.owner.angleRad;
  }
}
