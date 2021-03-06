import { getCompletedLevels, getLevelByNumber } from "../utils";

import * as constants from "../constants";

const BUTTONS_X_OFFSET = 75;
const BUTTONS_X_DISTANCE = 64;
const BUTTONS_Y_OFFSET = 40;

export class AdminBar {
  constructor(scene, showExit = false, levelNumber) {
    this.scene = scene;
    const config = scene.sys.game.CONFIG;

    this.image = scene.add
      .image(
        config.width - BUTTONS_X_OFFSET,
        BUTTONS_Y_OFFSET,
        constants.TEXTURE_ATLAS,
        "admin_sound_off"
      )
      .setDepth(constants.MAX_DEPTH)
      .setScrollFactor(0)
      .setInteractive();
    this.image.on("pointerup", () => {
      this.scene.sound.play("button_click");
      this.updateSoundRegistry();
      this.updateSoundTexture();
    });

    if (showExit) {
      const exitButton = scene.add
        .image(
          config.width - BUTTONS_X_OFFSET - BUTTONS_X_DISTANCE,
          BUTTONS_Y_OFFSET,
          constants.TEXTURE_ATLAS,
          "admin_home"
        )
        .setDepth(constants.MAX_DEPTH)
        .setScrollFactor(0)
        .setInteractive();
      exitButton.on("pointerup", () => {
        this.scene.sound.play("button_click");
        this.scene.scene.start("StartMenuScene");
      });
    }

    if (levelNumber) {
      const selectLevelButton = scene.add
        .image(
          config.width - BUTTONS_X_OFFSET - 2 * BUTTONS_X_DISTANCE,
          BUTTONS_Y_OFFSET,
          constants.TEXTURE_ATLAS,
          "admin_select_level"
        )
        .setDepth(constants.MAX_DEPTH)
        .setScrollFactor(0)
        .setInteractive();
      selectLevelButton.on("pointerup", () => {
        this.scene.sound.play("button_click");
        this.scene.scene.start("LevelMenuScene", { levelNumber });
      });

      const completedLevels = getCompletedLevels();
      const levelName = getLevelByNumber(levelNumber).name;
      const isEnabled = levelName in completedLevels;
      const key = isEnabled ? "admin_retry_enabled" : "admin_retry_disabled";
      const retryButton = scene.add
        .image(
          config.width - BUTTONS_X_OFFSET - 3 * BUTTONS_X_DISTANCE,
          BUTTONS_Y_OFFSET,
          constants.TEXTURE_ATLAS,
          key
        )
        .setDepth(constants.MAX_DEPTH)
        .setScrollFactor(0);
      if (isEnabled) {
        retryButton.setInteractive();
        retryButton.on("pointerup", () => {
          this.scene.sound.play("button_click");
          this.scene.scene.start("GameplayScene", { levelNumber });
        });
      }
    }

    this.updateSoundTexture();
  }

  updateSoundTexture(): void {
    const soundOn = this.scene.game.registry.get("sound");
    this.image.setFrame(soundOn ? "admin_sound_on" : "admin_sound_off");
  }

  updateSoundRegistry(): void {
    const soundOn = this.scene.game.registry.get("sound");

    this.scene.game.registry.set("sound", !soundOn);
    this.scene.game.sound.mute = soundOn;
  }
}
