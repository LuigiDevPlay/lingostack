import BootScene from "./scenes/boot.js";
import GameScene from "./scenes/game.js";

// Detectamos si es un dispositivo móvil de manera estricta
const isMobile =
  /Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) && window.innerWidth < 1024;

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  transparent: true,

  fps: {
    target: 60,
    forceSetTimeOut: true,
  },

  render: {
    powerPreference: "high-performance",
    antialias: false,
    pixelArt: true,
  },

  // CONFIGURACIÓN DE ESCALA DINÁMICA CORREGIDA
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Forzamos un tamaño base responsivo nativo que Phaser entiende perfectamente
    width: isMobile ? 360 : "100%",
    height: isMobile ? 640 : "100%",
  },

  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
