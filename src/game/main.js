import BootScene from "./scenes/boot.js";
import GameScene from "./scenes/game.js";

// 1. Obtenemos el elemento físico principal
const gameMain = document.getElementById("game-main");

// 2. Variables base de control de tamaño para el motor
let finalWidth;
let finalHeight;

// Tu lógica exacta: Si es una pantalla o contenedor de PC (> 768px)
if (window.innerWidth > 768 && gameMain) {
  // Calculamos los píxeles reales exactos que tiene tu div estirado por Tailwind
  finalWidth = gameMain.clientWidth;
  finalHeight = gameMain.clientHeight;
} else {
  // Si es menor o igual a 768px (Móvil), le inyectamos los valores puros del viewport que te funcionan
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
    // Aquí inyectamos los valores numéricos fijos calculados arriba
    width: finalWidth,
    height: finalHeight,
  },

  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [BootScene, GameScene],
};

// Inicializamos el juego
const game = new Phaser.Game(config);

// Truco de respaldo para reajustar si la PC tarda un milisegundo en procesar el layout de Tailwind
if (window.innerWidth > 768) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (gameMain) {
        game.scale.resize(gameMain.clientWidth, gameMain.clientHeight);
      }
    }, 150);
  });
}
