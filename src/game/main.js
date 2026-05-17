import BootScene from "./scenes/boot.js";
import GameScene from "./scenes/game.js";

const gameMain = document.getElementById("game-main");

let finalWidth;
let finalHeight;

// Evaluamos si es una pantalla de PC (> 768px)
if (window.innerWidth > 768 && gameMain) {
  // Ahora que el HTML sí se estira, leemos los píxeles reales del contenedor en la PC
  finalWidth = gameMain.clientWidth;
  finalHeight = gameMain.clientHeight;
} else {
  // En teléfonos, forzamos tus valores nativos del viewport para evitar fallos de scroll
  finalWidth = window.innerWidth;
  finalHeight = window.innerHeight;
}

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

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: finalWidth,
    height: finalHeight,
  },

  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [BootScene, GameScene],
};

const game = new Phaser.Game(config);

// Reajuste por si el layout tarda milisegundos en renderizarse por completo en PC
if (window.innerWidth > 768) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (gameMain) {
        game.scale.resize(gameMain.clientWidth, gameMain.clientHeight);
      }
    }, 150);
  });
}
