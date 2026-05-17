import BootScene from "./scenes/boot.js";
import GameScene from "./scenes/game.js";

// Detectamos si es un dispositivo móvil (Teléfono o Tablet)
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

  // CONFIGURACIÓN DE ESCALA DINÁMICA HÍBRIDA
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Si es móvil usa los valores en píxeles fijos del Viewport, si es PC usa el 100% del contenedor div
    width: isMobile ? window.innerWidth : "100%",
    height: isMobile ? window.innerHeight : "100%",
  },

  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
