export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // 1. Carga de Imágenes
    // Asegúrate de que "logo" y "bg" existan.
    // Si tu archivo se llama diferente, cámbialo aquí.
    // this.load.image("logo", "src/assets/img/lingo_stack.png");

    // Si tu GameScene usa un fondo, cárgalo aquí para que no de error
    // this.load.image("bg", "src/assets/img/tu_unica_imagen.png");

    // 2. Efectos de Sonido (SFX)
    this.load.audio("s_correct", "src/assets/sounds/correct.mp3");
    this.load.audio("s_error", "src/assets/sounds/error.mp3");
    this.load.audio("s_thud", "src/assets/sounds/thud.mp3");
    this.load.audio("s_gameover", "src/assets/sounds/gameover.mp3");

    // 3. Música de Fondo (BGM)
    // Importante: Verifica que las extensiones sean .mp3
    this.load.audio("bgm_menu", "src/assets/sounds/bgm_menu.mp3");
    this.load.audio("bgm_game", "src/assets/sounds/bgm_game.mp3");

    // 4. Lógica de carga del JSON según dificultad
    // Esto es crítico: debe coincidir con el valor del select en index.html
    const gameMode = localStorage.getItem("selectedDifficulty") || "normal";
    let fileName = "normal_100.json";

    if (gameMode === "basico") {
      fileName = "basico_100.json";
    } else if (gameMode === "dificil" || gameMode === "experto") {
      fileName = "pro_100.json";
    }

    console.log(`Cargando modo: ${gameMode} -> Archivo: ${fileName}`);

    this.load.json("phrasesData", `src/data/${fileName}`);

    // Feedback de carga
    this.load.on("progress", (value) => {
      // Aquí podrías actualizar una barra de carga visual si quisieras
    });

    this.load.on("complete", () => {
      console.log("Todos los recursos se han descargado correctamente.");
    });
  }

  create() {
    // Verificamos que el JSON se cargó bien antes de pasar a la siguiente escena
    if (!this.cache.json.exists("phrasesData")) {
      console.error("ERROR: No se pudo cargar el archivo JSON de frases.");
    }

    this.scene.start("GameScene");
  }
}
