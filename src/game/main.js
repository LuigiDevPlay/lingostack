import BootScene from "./scenes/boot.js";
import GameScene from "./scenes/game.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  // 1. Quitamos el color sólido y activamos la transparencia
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 450,
    height: 800,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
