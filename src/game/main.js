import BootScene from "./scenes/boot.js";
import GameScene from "./scenes/game.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  transparent: true,

  // OPTIMIZACIÓN CRÍTICA PARA MÓVILES (Evita el lag y ahorra batería)
  fps: {
    target: 60, // 60 FPS estables o 30 si el teléfono es de gama muy baja
    forceSetTimeOut: true, // Fuerza a mantener el ritmo sin sobrecargar la CPU
  },

  render: {
    powerPreference: "high-performance", // Pide rendimiento al procesador gráfico
    antialias: false, // Desactiva antialias para ganar velocidad de renderizado
    pixelArt: true, // Si usas textos o bordes afilados, mejora el rendimiento
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
