import BootScene from "./scenes/boot.js";
import GameScene from "./scenes/game.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  transparent: true,
  fps: {
    target: 30, // 30 FPS es suficiente para un juego de palabras y ahorra mucha batería/CPU
    forceSetTimeOut: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
