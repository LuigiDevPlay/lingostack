import BootScene from "./scenes/boot.js";
import GameScene from "./scenes/game.js";

// Detectamos si es un dispositivo móvil de forma estricta
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

  // CONFIGURACIÓN DE ESCALA DINÁMICA DE PHASER INTEGRADA
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // En móvil forzamos tus valores del viewport. En PC le pasamos el string "100%" en minúsculas.
    width: window.innerWidth,
    height: window.innerHeight,
  },

  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [BootScene, GameScene],
};

// Inicializamos el juego
const game = new Phaser.Game(config);

// TRUCO EXTRA PARA PC: Si es computadora, forzamos un reajuste de tamaño después de 100ms
// Esto asegura que Tailwind ya haya estirado el div gris antes de que Phaser dibuje el lienzo.
if (!isMobile) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      game.scale.refresh();
    }, 100);
  });
}
