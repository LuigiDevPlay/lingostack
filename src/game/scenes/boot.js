export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // --- 1. ELEMENTOS VISUALES DE CARGA ---
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Texto de "Cargando..."
    const loadingText = this.make
      .text({
        x: width / 2,
        y: height / 2 - 50,
        text: "Cargando LingoStack...",
        style: { font: "20px monospace", fill: "#38bdf8" },
      })
      .setOrigin(0.5);

    // Barra de progreso (fondo)
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1e293b, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 30);

    // --- 2. CARGA DE RECURSOS (Tu código original) ---
    this.load.audio("s_correct", "src/assets/sounds/correct.mp3");
    this.load.audio("s_error", "src/assets/sounds/error.mp3");
    this.load.audio("s_thud", "src/assets/sounds/thud.mp3");
    this.load.audio("s_gameover", "src/assets/sounds/gameover.mp3");
    this.load.audio("bgm_menu", "src/assets/sounds/bgm_menu.mp3");
    this.load.audio("bgm_game", "src/assets/sounds/bgm_game.mp3");

    const gameMode = localStorage.getItem("selectedDifficulty") || "normal";
    let fileName =
      gameMode === "basico"
        ? "basico_100.json"
        : gameMode === "dificil" || gameMode === "experto"
          ? "pro_100.json"
          : "normal_100.json";

    this.load.json("phrasesData", `src/data/${fileName}`);

    // --- 3. LOGICA DE LA BARRA DE PROGRESO ---
    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x38bdf8, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 + 5, 300 * value, 20);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      console.log("Carga completa");
    });
  }

  create() {
    if (!this.cache.json.exists("phrasesData")) {
      console.error("ERROR: No se pudo cargar el JSON.");
    }
    this.scene.start("GameScene");
  }
}
