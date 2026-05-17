import BootScene from "./scenes/boot.js";
import GameScene from "./scenes/game.js";

// Detectamos de forma estricta si es un entorno móvil (Teléfono o Tablet)
const isMobile =
  /Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) && window.innerWidth < 1024;

// Obtenemos el contenedor HTML real de la PC para saber sus dimensiones exactas
const container = document.getElementById("game-container");
const containerWidth = container ? container.clientWidth : 800;
const containerHeight = container ? container.clientHeight : 600;

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  transparent: true,

  // OPTIMIZACIÓN CRÍTICA PARA MÓVILES (Evita el lag y ahorra batería)
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },

  render: {
    powerPreference: "high-performance",
    antialias: false,
    pixelArt: true,
  },

  // CONFIGURACIÓN DE ESCALA CONTROLADA POR ENTORNO
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Si es móvil, usa los valores nativos del Viewport (lo que te funcionó a ti)
    // Si es PC, lee los píxeles reales calculados del contenedor renderizado por CSS
    width: isMobile ? window.innerWidth : containerWidth,
    height: isMobile ? window.innerHeight : containerHeight,
  },

  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
