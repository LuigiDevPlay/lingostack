export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.phrasesInStack = [];
    this.activePhrase = null;
    this.nextPhraseData = null;
    this.score = 0;
    this.isPaused = false;
    this.isGameOver = false;

    // Variables de control de datos
    this.allPhrases = [];
    this.phrasesData = [];
    this.currentLevel = 1;

    // Idiomas seleccionados
    this.sourceLang = localStorage.getItem("sourceLang") || "en";
    this.targetLang = localStorage.getItem("targetLang") || "es";
    this.langText = `${this.sourceLang.toUpperCase()} ➔ ${this.targetLang.toUpperCase()}`;

    // Variables de control de layout
    this.PHRASE_HEIGHT = 0;
    this.GROUND_Y = 0;
    this.scaleFactor = 1;
    this.currentBoxHeight = 0;

    // Lógica de Dificultad
    this.gameMode = localStorage.getItem("selectedDifficulty") || "normal";
    this.wasPausedDuringPhrase = false;
    // Configurar el máximo de fallos según el modo
    if (this.gameMode === "experto") {
      this.MAX_FAILS = 3;
    } else if (this.gameMode === "basico") {
      this.MAX_FAILS = 999; // Prácticamente infinito
    } else {
      this.MAX_FAILS = 5; // Normal y Difícil
    }

    this.fails = 0;
  }

  preload() {
    // 1. Carga del JSON según dificultad
    let fileName = "normal_100.json";
    if (this.gameMode === "basico") fileName = "basico_100.json";
    if (this.gameMode === "dificil" || this.gameMode === "experto") fileName = "pro_100.json";

    this.load.json("phrasesData", `src/data/${fileName}`);

    // 2. Efectos de Sonido (SFX)
    this.load.audio("s_correct", "src/assets/sounds/correct.mp3");
    this.load.audio("s_error", "src/assets/sounds/error.mp3");
    this.load.audio("s_thud", "src/assets/sounds/thud.mp3");
    this.load.audio("s_gameover", "src/assets/sounds/gameover.mp3");

    // 3. Música de Fondo (BGM)
    // Usamos los nombres de los archivos que tienes
    this.load.audio(
      "bgm_menu",
      "src/assets/audio/viacheslavstarostin-game-gaming-video-game-music-471936.mp3",
    );
    this.load.audio("bgm_game", "src/assets/audio/the_mountain-game-game-music-508018.mp3");
  }

  create() {
    const isMobile = this.scale.width < 1024;
    this.showUI(isMobile);

    this.allPhrases = this.cache.json.get("phrasesData");
    this.phrasesData = this.allPhrases.filter((p) => p.nivel === this.currentLevel);

    this.score = 0;
    this.fails = 0;
    this.phrasesInStack = [];
    this.isGameOver = false;
    this.isPaused = true;

    this.updateLayoutSettings();
    this.setupModalEvents();
    this.setupControlButtons();

    // Crear objetos de sonido
    this.sndCorrect = this.sound.add("s_correct");
    this.sndError = this.sound.add("s_error");
    this.sndThud = this.sound.add("s_thud");
    this.sndGameOver = this.sound.add("s_gameover");
    // Configurar música
    this.menuBgm = this.sound.add("bgm_menu", { volume: 0.3, loop: true });
    this.gameBgm = this.sound.add("bgm_game", { volume: 0.1, loop: true });

    // Iniciar música de menú inmediatamente
    this.menuBgm.play();
    this.currentLevel = 1;
    this.updateLevelUI();

    // Actualización de idioma
    this.updateDualUI(
      "current-lang",
      `${this.sourceLang.toUpperCase()} ➔ ${this.targetLang.toUpperCase()}`,
    );

    // Lógica de vidas
    const failContainerM = document.getElementById("fail-display-m")?.closest(".flex-1");
    if (this.gameMode === "basico") {
      if (failContainerM) failContainerM.style.visibility = "hidden";
      this.updateDualUI("fail-display", "∞");
    } else {
      if (failContainerM) failContainerM.style.visibility = "visible";
      this.updateDualUI("fail-display", `0/${this.MAX_FAILS}`);
    }

    // Configuración de Input inicial
    this.initInputMethod(isMobile);

    this.scale.on("resize", () => {
      const nowMobile = this.scale.width < 1024;
      this.showUI(nowMobile);
      this.initInputMethod(nowMobile); // Re-configura el input al cambiar tamaño
      this.updateLayoutSettings();
      this.repositionElements();
    });

    const pcInput = document.getElementById("translation-input");
    if (pcInput) {
      pcInput.replaceWith(pcInput.cloneNode(true));
      const freshInput = document.getElementById("translation-input");
      freshInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.checkTranslation(freshInput.value);
        }
      });
    }
  }

  initInputMethod(isMobile) {
    if (isMobile) {
      this.setupVirtualKeyboard();
    } else {
      // Limpiar teclado virtual si existía
      const kb = document.getElementById("virtual-keyboard-m");
      if (kb) kb.innerHTML = "";

      this.setupInputListeners();

      // Asegurar que el input de PC esté listo
      const pcInput = document.getElementById("translation-input");
      if (pcInput) {
        const freshInput = pcInput.cloneNode(true);
        pcInput.replaceWith(freshInput);
        freshInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            this.checkTranslation(freshInput.value);
            freshInput.value = "";
          }
        });
      }
    }
  }

  showUI(isMobile) {
    const mobileHeader = document.getElementById("mobile-ui-header");
    const mobileFooter = document.getElementById("mobile-ui-footer");
    const pcHeader = document.getElementById("pc-ui-header");
    const pcAside = document.getElementById("pc-ui-aside");

    if (isMobile) {
      mobileHeader?.classList.remove("hidden");
      mobileFooter?.classList.remove("hidden");
      if (mobileFooter) mobileFooter.style.display = "flex";
      pcHeader?.classList.add("hidden");
      pcAside?.classList.add("hidden");
    } else {
      mobileHeader?.classList.add("hidden");
      if (mobileFooter) {
        mobileFooter.classList.add("hidden");
        mobileFooter.style.display = "none";
      }
      pcHeader?.classList.remove("hidden");
      if (pcAside) {
        pcAside.classList.remove("hidden");
        pcAside.style.display = "flex";
      }
    }
  }

  updateLayoutSettings() {
    const { width, height } = this.scale;
    const isMobile = width < 1024;
    this.scaleFactor = isMobile ? 1.25 : 1;
    this.currentBoxHeight = 65 * this.scaleFactor;
    this.PHRASE_HEIGHT = this.currentBoxHeight + 1.5 * this.scaleFactor;
    const borderOffset = 6;
    this.GROUND_Y = height - this.currentBoxHeight / 2 - borderOffset;
  }

  update() {
    // 1. Bloqueo de seguridad: Si no hay frase, está en pausa o terminó el juego, no hacer nada
    if (!this.activePhrase || this.isGameOver || this.isPaused) return;

    // 2. Lógica de Velocidad Condicional (Basico no escala)
    let baseSpeed = this.gameMode === "experto" ? 2.5 : 2.0;
    let speed;

    if (this.gameMode === "basico") {
      speed = 1.5; // Velocidad fija y amigable para principiantes
    } else {
      // Escala 0.6 por nivel para Normal y Experto
      speed = baseSpeed + (this.currentLevel - 1) * 0.6;
    }

    this.activePhrase.y += speed;

    // 3. Cálculo del punto de parada en la pila
    let currentStopPoint = this.GROUND_Y - this.phrasesInStack.length * this.PHRASE_HEIGHT;

    // 4. Detección de colisión con el suelo o la pila
    if (this.activePhrase.y >= currentStopPoint) {
      this.activePhrase.y = currentStopPoint;

      // REPRODUCIR SONIDO DE CAÍDA (Añadido)
      if (this.sndThud) {
        this.sndThud.play({ volume: 0.4 });
      }

      // Guardamos en la pila
      this.phrasesInStack.push(this.activePhrase);
      const lastPhrase = this.activePhrase;
      this.activePhrase = null;

      // Actualizar contadores visuales
      this.updateDualUI("counter", `${this.phrasesInStack.length}/5`);

      // 5. Verificar derrota
      if (this.phrasesInStack.length >= 5) {
        this.triggerGameOver();
      } else {
        // 6. Generar siguiente frase SOLO si no estamos en medio de una transición de nivel
        // Usamos un pequeño retraso para que no sea instantáneo
        this.time.delayedCall(300, () => {
          // IMPORTANTE: Si durante esos 300ms se activó la pausa de nivel, spawnPhrase no hará nada
          if (!this.isPaused && !this.isGameOver) {
            this.spawnPhrase();
          }
        });
      }
    }
  }

  spawnPhrase() {
    if (this.isGameOver || this.isPaused || this.activePhrase) return;

    this.wasPausedDuringPhrase = false;

    // 1. FILTRADO DINÁMICO: Asegura que los datos correspondan al nivel actual
    const needsFiltering =
      !this.phrasesData ||
      this.phrasesData.length === 0 ||
      (this.phrasesData[0] && this.phrasesData[0].nivel !== this.currentLevel);

    if (needsFiltering) {
      this.phrasesData = this.allPhrases.filter((p) => p.nivel === this.currentLevel);
      Phaser.Utils.Array.Shuffle(this.phrasesData);
    }

    // 2. GESTIÓN DE LA FRASE ACTUAL
    if (!this.nextPhraseData) {
      this.nextPhraseData = this.getRandomPhrase();
    }

    const currentData = this.nextPhraseData;

    // 3. GESTIÓN DE LA SIGUIENTE FRASE (PREVIEW)
    this.nextPhraseData = this.getRandomPhrase();
    this.updateNextPhraseUI();

    // 4. CREACIÓN DEL CONTENEDOR VISUAL
    const centerX = this.scale.width / 2;
    const container = this.add.container(centerX, -150);

    const isMobile = this.scale.width < 1024;

    // Ajuste de ancho: En móvil usamos el 95% para dar más espacio a la letra
    const boxWidth = this.scale.width * (isMobile ? 0.95 : 0.85);
    const boxHeight = this.currentBoxHeight;

    const rect = this.add.graphics();
    const levelColors = { 1: 0x0ea5e9, 2: 0x8b5cf6, 3: 0xef4444 };
    const color = levelColors[this.currentLevel] || 0x0ea5e9;

    rect.fillStyle(color, 1);
    rect.lineStyle(3, 0xffffff, 1);
    rect.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 12);
    rect.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 12);

    const displayValue = currentData[this.sourceLang] || currentData.en;

    // AJUSTE DE LETRA: Aumentamos a 42px solo en móvil, PC se mantiene en 36px
    const baseFontSize = isMobile ? 42 : 36;

    const text = this.add
      .text(0, 0, displayValue, {
        fontFamily: "Arial Black",
        fontSize: `${baseFontSize * this.scaleFactor}px`,
        color: "#ffffff",
        // Sombra para mejorar contraste en pantallas pequeñas
        shadow: { blur: 2, color: "#000000", fill: true, offsetX: 2, offsetY: 2 },
      })
      .setOrigin(0.5);

    // ESCALADO DINÁMICO: En móvil permitimos que use casi todo el ancho del cuadro
    const maxTextWidth = boxWidth * (isMobile ? 0.95 : 0.9);
    if (text.width > maxTextWidth) {
      text.setScale(maxTextWidth / text.width);
    }

    container.add([rect, text]);

    // 5. ASIGNACIÓN DE METADATOS
    container.translation = currentData[this.targetLang] || currentData.es;
    container.originalText = displayValue;
    container.speedFactor = 1 + (this.currentLevel - 1) * 0.25;

    // 6. ACTUALIZACIÓN DE ESTADO Y UI DE PISTAS
    this.activePhrase = container;

    const pcNextPhrase = document.getElementById("next-phrase");
    const mobileHint = document.getElementById("phrase-hint-m");

    if (pcNextPhrase) pcNextPhrase.innerText = container.translation;
    if (mobileHint) mobileHint.innerText = `Traduce: ${container.translation}`;

    this.updateDualUI("counter", `${this.phrasesInStack.length}/5`);
  }

  checkTranslation(inputValue) {
    let text = inputValue.trim().toLowerCase();
    if (!text) return;

    const pcInput = document.getElementById("translation-input");
    const mobileDisplay = document.getElementById("virtual-display-m");
    const pcNextPhrase = document.getElementById("next-phrase");
    const mobileHint = document.getElementById("phrase-hint-m");

    /**
     * FUNCIÓN INTERNA: Valida si la entrada coincide con la traducción
     * Funciona para: "あ (A)", "Bonjour (bonjur)", o "Casa"
     */
    const isCorrect = (phraseObj, userInput) => {
      if (!phraseObj || !phraseObj.translation) return false;

      let correct = phraseObj.translation.toLowerCase();

      // Si tiene paréntesis, extraemos las dos opciones posibles
      if (correct.includes("(") && correct.includes(")")) {
        // "あ (a)" -> principal: "あ", bracket: "a"
        // "bonjour (bonjur)" -> principal: "bonjour", bracket: "bonjur"
        const principal = correct.split("(")[0].trim();
        const bracket = correct.match(/\(([^)]+)\)/)[1].trim();

        return userInput === principal || userInput === bracket;
      }

      // Validación estándar para palabras sin paréntesis
      return userInput === correct;
    };

    let foundTarget = null;
    let foundIndex = -1;

    // 1. Verificar primero la frase que está cayendo (activePhrase)
    if (this.activePhrase && isCorrect(this.activePhrase, text)) {
      foundTarget = this.activePhrase;
      this.activePhrase = null;
    }
    // 2. Si no es la activa, buscar en la pila acumulada (phrasesInStack)
    else {
      for (let i = 0; i < this.phrasesInStack.length; i++) {
        if (isCorrect(this.phrasesInStack[i], text)) {
          foundTarget = this.phrasesInStack[i];
          foundIndex = i;
          break;
        }
      }
    }

    if (foundTarget) {
      // --- ACIERTO: LIMPIEZA ---
      if (pcInput) pcInput.value = "";
      if (mobileDisplay) mobileDisplay.innerText = "";
      if (this.sndCorrect) this.sndCorrect.play({ volume: 0.05 });

      // --- VOZ (Speech Synthesis) ---
      const synth = window.speechSynthesis;
      synth.cancel();

      // Limpiamos el texto para que el narrador no lea los paréntesis
      let rawSpeechText = foundTarget.originalText || foundTarget.text || "";
      let finalSpeechText = rawSpeechText.includes("(")
        ? rawSpeechText.split("(")[0].trim()
        : rawSpeechText;

      setTimeout(() => {
        if (!finalSpeechText) return;
        const utterThis = new SpeechSynthesisUtterance(finalSpeechText);
        const langMap = { en: "en-US", es: "es-ES", fr: "fr-FR", it: "it-IT", jp: "ja-JP" };
        const fullLangCode = langMap[this.sourceLang] || this.sourceLang;
        utterThis.lang = fullLangCode;
        utterThis.volume = 1.0;
        utterThis.rate = 0.8;

        const voices = synth.getVoices();
        const nativeVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(this.sourceLang.toLowerCase()) ||
            v.lang.toLowerCase().includes(fullLangCode.toLowerCase()),
        );
        if (nativeVoice) utterThis.voice = nativeVoice;
        synth.speak(utterThis);
      }, 120);

      // --- PUNTUACIÓN ---
      let pointsToAdd = 10;
      if (
        (this.gameMode === "dificil" || this.gameMode === "experto") &&
        this.wasPausedDuringPhrase
      ) {
        pointsToAdd = 5;
      }
      this.score += pointsToAdd;
      this.updateScore();

      // --- MOVIMIENTO DE LA PILA ---
      if (foundIndex !== -1) {
        this.phrasesInStack.splice(foundIndex, 1);
        for (let i = foundIndex; i < this.phrasesInStack.length; i++) {
          const phraseToMove = this.phrasesInStack[i];
          const newY = this.GROUND_Y - i * this.PHRASE_HEIGHT;
          this.tweens.add({
            targets: phraseToMove,
            y: newY,
            duration: 250,
            ease: "Bounce.easeOut",
            onComplete: () => {
              if (this.sndThud) this.sndThud.play({ volume: 0.2 });
            },
          });
        }
        this.updateDualUI("counter", `${this.phrasesInStack.length}/5`);
      }

      foundTarget.destroy();

      // --- GESTIÓN DE NIVELES ---
      let calculatedLevel = Math.floor(this.score / 50) + 1;
      if (calculatedLevel > 50) calculatedLevel = 50;

      if (calculatedLevel > this.currentLevel) {
        this.currentLevel = calculatedLevel;
        this.nextPhraseData = null;

        // LLAMADA CRÍTICA: Actualiza los textos de nivel en la pantalla
        this.updateLevelUI();

        // Filtrar frases para el nuevo nivel
        this.phrasesData = this.allPhrases.filter((p) => p.nivel === this.currentLevel);

        const msgs = ["¡Excelente!", "Siguiente Nivel", "Cargando frases...", "¡Vas muy bien!"];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];

        if (pcNextPhrase) pcNextPhrase.innerText = msg;
        if (mobileHint) mobileHint.innerText = msg;

        this.showLevelTransition();
      } else {
        // AGREGAR ESTO: Si no subió de nivel, lanzar la siguiente frase tras un breve delay
        if (!this.activePhrase && !this.isPaused) {
          this.time.delayedCall(300, () => this.spawnPhrase());
        }
      }
    } else {
      // --- ERROR ---
      if (this.sndError) this.sndError.play({ volume: 0.5 });
      if (this.gameMode !== "basico") {
        this.fails++;
        this.updateDualUI("fail-display", this.fails.toString());
        if (this.fails >= this.MAX_FAILS) {
          this.triggerGameOver("DEMASIADOS ERRORES");
          return;
        }
      }
      if (pcInput) {
        pcInput.value = "";
        pcInput.classList.add("border-red-600", "animate-shake");
        setTimeout(() => pcInput.classList.remove("border-red-600", "animate-shake"), 500);
      }
      if (mobileDisplay) {
        mobileDisplay.innerText = "";
        const errorMsg =
          this.gameMode === "basico" ? "❌ CASI..." : `❌ ERROR ${this.fails}/${this.MAX_FAILS}`;
        this.updateDualUI("phrase-hint", errorMsg);
      }
    }
  }

  setupInputListeners() {
    const el = document.getElementById("translation-input");
    if (!el) return;

    // Limpiamos cualquier listener previo
    const newEl = el.cloneNode(true);
    el.parentNode.replaceChild(newEl, el);

    newEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        // IMPORTANTE: Quitamos la restricción de pausa aquí
        // para que el código de validación se ejecute
        this.checkTranslation(newEl.value);
        newEl.value = "";
      }
    });

    // Forzar el foco para que puedas escribir de inmediato
    setTimeout(() => newEl.focus(), 500);
  }

  setupVirtualKeyboard() {
    const container = document.getElementById("virtual-keyboard-m");
    const display = document.getElementById("virtual-display-m");
    if (!container || !display) return;

    container.innerHTML = "";
    // Eliminamos justify-between y usamos flex-col directo
    container.className = "w-full flex flex-col h-full overflow-hidden p-1";

    let currentInput = display.innerText;

    // --- 1. LÓGICA DE CARACTERES ---
    let allChars = [];
    if (this.targetLang === "jp") {
      if (this.jpPage === undefined) this.jpPage = 1;
      const levels = {
        1: "あいうえおかきくけこさしすせそ",
        2: "たちつてとなにぬねのはひふへほ",
        3: "まみむめもらりるれろやゆよわん",
      };
      allChars = levels[this.jpPage].split("");

      const levelTabs = document.createElement("div");
      levelTabs.className =
        "flex justify-around bg-slate-950/50 p-1 mb-1 rounded-lg border border-slate-800 shrink-0";
      [1, 2, 3].forEach((num) => {
        const tab = document.createElement("button");
        tab.innerText = `Niv ${num}`;
        tab.className = `px-2 py-0.5 text-[9px] font-black rounded-md ${this.jpPage === num ? "bg-sky-500 text-white" : "text-slate-500"}`;
        tab.onclick = () => {
          this.jpPage = num;
          this.setupVirtualKeyboard();
        };
        levelTabs.appendChild(tab);
      });
      container.appendChild(levelTabs);
    } else {
      allChars = "QWERTYUIOPASDFGHJKLZXCVBNMÑ".split("");
    }

    // --- 2. ÁREA DE LETRAS (Grid) ---
    const keysGrid = document.createElement("div");
    // min-h-0 es clave para que el grid no crezca más de lo que permite el padre
    keysGrid.className = "grid gap-1 flex-1 min-h-0 overflow-hidden";
    keysGrid.style.display = "grid";

    // Usamos 9 columnas para inglés para que sea más bajo y quepa mejor
    const cols = this.targetLang === "jp" ? 5 : 9;
    keysGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    keysGrid.style.gridAutoRows = "1fr";

    allChars.forEach((char) => {
      const key = document.createElement("button");
      key.innerText = char;
      key.className =
        "bg-slate-800 text-white font-black rounded-md border-b-2 border-slate-950 active:translate-y-[1px] active:border-b-0 text-[10px] flex items-center justify-center";

      key.addEventListener("touchend", (e) => {
        e.preventDefault();
        currentInput += char;
        display.innerText = currentInput;
        key.classList.add("bg-slate-700");
        setTimeout(() => key.classList.remove("bg-slate-700"), 100);
      });
      keysGrid.appendChild(key);
    });
    container.appendChild(keysGrid);

    // --- 3. ACCIONES Y LLAMADA ---
    const onEnter = (val) => {
      if (val.trim() !== "") {
        this.checkTranslation(val.trim());
        display.innerText = "";
        currentInput = "";
      }
    };
    const onDelete = () => {
      currentInput = currentInput.slice(0, -1);
      display.innerText = currentInput;
    };
    const onSpace = () => {
      currentInput += " ";
      display.innerText = currentInput;
    };

    this.addKeyboardControls(container, display, onEnter, onDelete, onSpace);
  }

  addKeyboardControls(container, display, onEnter, onDelete, onSpace) {
    const ctrlRow = document.createElement("div");
    // Reducimos mt-1 y pt-1 para ganar espacio vertical
    ctrlRow.className = "flex gap-1 w-full mt-1 pt-1 border-t border-slate-700/30 shrink-0 h-10";

    // Botón BORRAR
    const delBtn = document.createElement("button");
    delBtn.innerHTML = "⌫";
    delBtn.className =
      "flex-1 bg-slate-700 text-red-400 rounded-lg border-b-2 border-slate-950 font-bold text-lg active:translate-y-[1px] flex items-center justify-center";
    delBtn.onclick = (e) => {
      e.preventDefault();
      onDelete();
    };

    // Botón ESPACIO
    const spaceBtn = document.createElement("button");
    spaceBtn.innerText = "___";
    spaceBtn.className =
      "flex-[1.5] bg-slate-800 text-slate-400 rounded-lg border-b-2 border-slate-950 font-black text-[9px] flex items-center justify-center";
    spaceBtn.onclick = (e) => {
      e.preventDefault();
      onSpace();
    };

    // Botón ENVIAR
    const enterBtn = document.createElement("button");
    enterBtn.innerText = "OK";
    enterBtn.className =
      "flex-[2] bg-sky-600 text-white rounded-lg border-b-2 border-sky-800 font-black text-[10px] flex items-center justify-center";
    enterBtn.onclick = (e) => {
      e.preventDefault();
      onEnter(display.innerText);
    };

    ctrlRow.append(delBtn, spaceBtn, enterBtn);
    container.appendChild(ctrlRow);
  }

  triggerGameOver() {
    // 🔊 REPRODUCIR SONIDO DE DERROTA
    if (this.sndGameOver) this.sndGameOver.play();

    this.isGameOver = true;
    this.isPaused = true;

    // 1. OBTENER PUNTAJE ACTUAL
    const currentScore = this.score;

    // 2. LÓGICA DE RÉCORD PERSONAL (Tu código original que sí funcionaba)
    const currentRecord = parseInt(localStorage.getItem("lingo_high_score")) || 0;
    if (currentScore > currentRecord) {
      localStorage.setItem("lingo_high_score", currentScore);
      console.log("¡Nuevo Récord Personal!");
    }

    // 3. LÓGICA DE HISTORIAL PARA EL RANKING (Añadido sin romper lo anterior)
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem("lingo_score_history")) || [];
    } catch (e) {
      history = [];
    }

    history.push(currentScore);
    history.sort((a, b) => b - a);
    history = history.slice(0, 10); // Guardamos los 10 mejores
    localStorage.setItem("lingo_score_history", JSON.stringify(history));

    // --- INTERFAZ DE GAME OVER ---
    const overScreen = document.getElementById("game-over-screen");
    const finalScoreLabel = document.getElementById("final-score");

    if (finalScoreLabel) finalScoreLabel.innerText = currentScore;

    if (overScreen) {
      overScreen.classList.remove("hidden");
      overScreen.classList.add("flex");

      document.getElementById("retry-btn").onclick = () => {
        overScreen.classList.replace("flex", "hidden");
        this.resetGame();
        this.createPreloader();
      };

      document.getElementById("change-lang-btn").onclick = () => {
        overScreen.classList.replace("flex", "hidden");
        const startBtn = document.getElementById("start-game-btn");
        if (startBtn) {
          startBtn.innerText = "INICIAR DESAFÍO";
          startBtn.style.backgroundColor = "";
        }
        const modal = document.getElementById("setup-modal");
        if (modal) modal.classList.remove("hidden");
        this.resetGame();
      };
    }
  }

  resetGame() {
    // 1. DETENER TODOS LOS EVENTOS PENDIENTES (Evita la frase doble)
    this.time.removeAllEvents();
    this.tweens.killAll();

    // 2. Limpiar Phaser por completo
    if (this.activePhrase) {
      this.activePhrase.destroy();
      this.activePhrase = null;
    }

    // Limpiar la pila del suelo
    this.phrasesInStack.forEach((phrase) => {
      if (phrase) phrase.destroy();
    });
    this.phrasesInStack = [];

    // 3. Resetear variables de estado
    this.score = 0;
    this.fails = 0;
    this.currentLevel = 1;
    this.isGameOver = false;
    this.isPaused = false;
    this.nextPhraseData = null; // Limpiar el "fantasma"

    // 4. Resetear Interfaz (DOM)
    this.phrasesData = this.allPhrases.filter((p) => p.nivel === 1);
    this.updateScore();
    this.updateLevelUI();

    // Actualizar contadores en el HTML
    this.updateDualUI("fail-display", `0/${this.MAX_FAILS}`);
    this.updateDualUI("counter", "0/5");
    this.updateDualUI("next-phrase", "Cargando...");
    this.updateDualUI("phrase-hint", "¡PREPÁRATE!");

    // Limpiar inputs y teclados
    if (this.scale.width < 1024) {
      this.setupVirtualKeyboard();
      const mobileDisplay = document.getElementById("virtual-display-m");
      if (mobileDisplay) mobileDisplay.innerText = "";
    }

    const pcInput = document.getElementById("translation-input");
    if (pcInput) {
      pcInput.value = "";
      pcInput.placeholder = "Escribe aquí...";
      pcInput.focus(); // Devolver el foco al input
    }

    // 5. Reiniciar ciclo de juego con un pequeño margen de seguridad
    this.time.delayedCall(200, () => {
      // Doble verificación: solo spawnea si no hay una frase ya activa
      if (!this.activePhrase) {
        this.spawnPhrase();
      }
    });
  }

  showLevelTransition() {
    this.isPaused = true;

    // --- DETECCIÓN DE SUSTO ANTES DE LIMPIAR ---
    const blocksAtEnd = this.phrasesInStack.length;
    const mensaje = this.getFlavorText(blocksAtEnd);
    const huboPeligro = blocksAtEnd >= 3;

    // 1. Limpieza
    this.phrasesInStack.forEach((p) => p && p.destroy());
    this.phrasesInStack = [];
    if (this.activePhrase) {
      this.activePhrase.destroy();
      this.activePhrase = null;
    }

    // 2. Filtro de datos
    this.phrasesData = this.allPhrases.filter((p) => p.nivel === this.currentLevel);

    // 3. UI de Transición
    const { width, height } = this.scale;
    const overlay = this.add.container(0, 0).setDepth(5000);
    const bg = this.add.rectangle(0, 0, width, height, 0x0f172a, 0.95).setOrigin(0);

    const banner = this.add
      .text(width / 2, height / 2, `NIVEL ${this.currentLevel}\n${mensaje}`, {
        fontFamily: "Arial Black",
        fontSize: "40px",
        color: huboPeligro ? "#fbbf24" : "#ef4444", // Amarillo si hubo susto
        align: "center",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    overlay.add([bg, banner]);

    // 4. Salida
    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          overlay.destroy();
          this.isPaused = false;
          this.spawnPhrase();
        },
      });
    });
  }

  getFlavorText(blocksCount) {
    // Lógica de Susto (3 o 4 bloques)
    if (blocksCount >= 3) {
      const frasesSusto = [
        "¡CASI ME ASUSTAS!",
        "¡POR POCO!",
        "¡UFF, QUÉ SALVADA!",
        "¡AL LÍMITE!",
        "¡QUÉ RECUPERACIÓN!",
      ];
      return frasesSusto[Math.floor(Math.random() * frasesSusto.length)];
    }

    // Hitos especiales
    if (this.currentLevel === 50) return "¡ERES UNA LEYENDA!";
    if (this.currentLevel > 40) return "¡NIVEL INGENIERO!";
    if (this.currentLevel % 10 === 0) return "¡NIVEL MAESTRO!";

    // Motivación normal
    const motivacion = [
      "¡MUY BIEN!",
      "¡EXCELENTE!",
      "¡SIGUE ASÍ!",
      "¡PERFECTO!",
      "¡ESTÁS IMPARABLE!",
    ];
    return motivacion[Math.floor(Math.random() * motivacion.length)];
  }

  repositionElements() {
    const centerX = this.scale.width / 2;
    if (this.activePhrase) this.activePhrase.x = centerX;
    this.phrasesInStack.forEach((p, i) => {
      p.x = centerX;
      p.y = this.GROUND_Y - i * this.PHRASE_HEIGHT;
    });
  }

  updateScore() {
    this.updateDualUI("score-display", this.score);
  }

  updateLevelUI() {
    // 1. Usar tu función genérica para actualizar el texto
    this.updateDualUI("level-display", this.currentLevel);

    // 2. Aplicar animaciones de Tailwind
    const lvPC = document.getElementById("level-display");
    const lvMob = document.getElementById("level-display-m");

    [lvPC, lvMob].forEach((el) => {
      if (el) {
        // Aseguramos que el texto cambie incluso si updateDualUI falló
        el.innerText = this.currentLevel;

        el.classList.add("scale-125", "text-yellow-400", "transition-all", "duration-300");
        setTimeout(() => {
          el.classList.remove("scale-125", "text-yellow-400");
        }, 500);
      }
    });
  }

  updateDualUI(id, text) {
    // Caso especial para el idioma (ej. EN ➔ ES)
    if (id === "current-lang") {
      const pc = document.getElementById("current-lang");
      const mob = document.getElementById("current-lang-m");
      if (pc) pc.innerText = text;
      if (mob) mob.innerText = text;
      return;
    }

    // Caso especial para fallos
    if (id === "fail-display") {
      const failPC = document.getElementById("fail-display-pc");
      const failM = document.getElementById("fail-display-m");
      const displayText = text.includes("/") ? text : `${text}/${this.MAX_FAILS}`;
      if (failPC) failPC.innerText = displayText;
      if (failM) failM.innerText = displayText;
      return;
    }

    // Caso general (puntos, nivel, contador)
    const pc = document.getElementById(id);
    const mob = document.getElementById(id + "-m"); // Buscamos el sufijo -m directamente
    if (pc) pc.innerText = text;
    if (mob) mob.innerText = text;
  }

  updateNextPhraseUI() {
    if (this.nextPhraseData) {
      // Muestra la próxima frase en el idioma que el usuario debe leer (sourceLang)
      this.updateDualUI("next-phrase", this.nextPhraseData[this.sourceLang]);
    }
  }

  getRandomPhrase() {
    // Retorna una frase al azar de la lista filtrada por nivel
    if (!this.phrasesData || this.phrasesData.length === 0) return null;
    return this.phrasesData[Math.floor(Math.random() * this.phrasesData.length)];
  }

  setupControlButtons() {
    const pauseBtn = document.getElementById("pause-btn");
    const pauseBtnM = document.getElementById("pause-btn-m");
    const resumeBtn = document.getElementById("resume-btn");

    // Elementos del nuevo Modal
    const quitModal = document.getElementById("quit-modal");
    const confirmQuitBtn = document.getElementById("confirm-quit"); // Botón que vibrará
    const cancelQuitBtn = document.getElementById("cancel-quit");

    // --- FUNCIÓN ACTUALIZADA CON VIBRACIÓN ---
    const showQuitModal = () => {
      if (!this.isPaused) this.togglePause(); // Pausar si no lo está
      quitModal.classList.remove("hidden");

      // Aplicar la vibración al botón de confirmación
      if (confirmQuitBtn) {
        // Primero eliminamos la clase si ya la tenía (para reiniciar la animación)
        confirmQuitBtn.classList.remove("animate-vibration");
        // Forzamos un reflujo del navegador (truco para reiniciar animaciones CSS)
        void confirmQuitBtn.offsetWidth;
        // Añadimos la clase para que empiece a vibrar
        confirmQuitBtn.classList.add("animate-vibration");
      }
    };
    // ----------------------------------------

    // Función para cerrar el modal y seguir jugando
    const hideQuitModal = () => {
      quitModal.classList.add("hidden");
      // Solo reanudamos si el juego no ha terminado
      if (this.isPaused && !this.isGameOver) this.togglePause();
    };

    // Asignar evento a botones de la casita (PC y Móvil)
    const btnBack = document.getElementById("back-to-menu");
    const btnBackM = document.getElementById("back-to-menu-m");

    if (btnBack) btnBack.onclick = showQuitModal;
    if (btnBackM) btnBackM.onclick = showQuitModal;

    // Lógica interna del Modal
    if (confirmQuitBtn) {
      confirmQuitBtn.onclick = () => {
        // (Opcional) Si el dispositivo lo soporta, vibración háptica real
        if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);

        window.location.href = "index.html";
      };
    }

    if (cancelQuitBtn) {
      cancelQuitBtn.onclick = hideQuitModal;
    }

    // Lógica de Pausa unificada
    if (pauseBtn) pauseBtn.onclick = () => this.togglePause();
    if (pauseBtnM) pauseBtnM.onclick = () => this.togglePause();
    if (resumeBtn) resumeBtn.onclick = () => this.togglePause();
  }

  togglePause() {
    if (this.isGameOver) return;

    // Cambiar el estado
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // --- ACTIVAR PAUSA ---
      this.physics.pause();
      this.tweens.pauseAll();
      this.time.paused = true;

      // Mostrar modal si existe
      const pauseModal = document.getElementById("pause-modal");
      if (pauseModal) pauseModal.classList.remove("hidden");

      // Penalización
      if (this.gameMode === "dificil" || this.gameMode === "experto") {
        this.wasPausedDuringPhrase = true;
      }

      this.updateDualUI("phrase-hint", "⏸️ JUEGO EN PAUSA");
    } else {
      // --- QUITAR PAUSA ---
      this.physics.resume();
      this.tweens.resumeAll();
      this.time.paused = false;

      // Ocultar modal
      const pauseModal = document.getElementById("pause-modal");
      if (pauseModal) pauseModal.classList.add("hidden");

      // Devolver foco al input
      const pcInput = document.getElementById("translation-input");
      if (pcInput) pcInput.focus();

      this.updateDualUI("phrase-hint", `Traduce: ${this.activePhrase?.originalText || "..."}`);
    }
  }

  // 1. Vincular el botón del modal (Pon esto al final de tu método create)
  setupModalEvents() {
    const startBtn = document.getElementById("start-game-btn");
    const modal = document.getElementById("setup-modal");

    if (!startBtn || !modal) return;

    startBtn.onclick = () => {
      // Capturamos los selectores del HTML
      this.sourceLang = document.getElementById("select-source").value;
      this.targetLang = document.getElementById("select-target").value;

      startBtn.innerText = "SINCRONIZANDO...";
      startBtn.style.backgroundColor = "#991b1b";

      setTimeout(() => {
        modal.classList.add("hidden");
        this.createPreloader();
      }, 500);
    };
  }

  createPreloader() {
    const { width, height } = this.cameras.main;

    // Overlay de carga
    const loaderContainer = this.add.container(0, 0).setDepth(1000);

    // 1. ELIMINADO: Ya no creamos el rectángulo 'bg' para que sea totalmente transparente
    const bg = this.add.rectangle(0, 0, width, height, 0x0f172a, 1).setOrigin(0);

    // 2. Barra de progreso estética
    const barWidth = 300;
    const barHeight = 6;
    const x = width / 2 - barWidth / 2;
    const y = height / 2 + 80; // Bajamos un poco más para que luzca bien bajo el logo

    // Fondo de la barra (Gris oscuro semitransparente para que se note dónde termina)
    const progressBg = this.add.rectangle(x, y, barWidth, barHeight, 0x1e293b, 0.8).setOrigin(0);

    // Barra de progreso (Rojo LuigiDev)
    const progressBar = this.add.rectangle(x, y, 0, barHeight, 0xef4444).setOrigin(0);

    const loadingText = this.add
      .text(width / 2, y - 30, "SINCRONIZANDO IDIOMAS...", {
        fontFamily: "Arial Black",
        fontSize: "16px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Solo añadimos los elementos visibles de la barra y el texto
    loaderContainer.add([bg, progressBg, progressBar, loadingText]);

    // Simulación de carga
    this.tweens.add({
      targets: progressBar,
      width: barWidth,
      duration: 1500,
      ease: "Power2",
      onUpdate: () => {
        const pct = Math.floor((progressBar.width / barWidth) * 100);
        loadingText.setText(`CARGANDO DATOS... ${pct}%`);
      },
      onComplete: () => {
        loadingText.setText("¡SISTEMA LISTO!");
        this.tweens.add({
          targets: loaderContainer,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            loaderContainer.destroy();
            this.startGame();
          },
        });
      },
    });
  }

  startGame() {
    if (!this.isPaused) return;

    this.isPaused = false;

    // DETENER música de menú e INICIAR música de acción
    if (this.menuBgm && this.menuBgm.isPlaying) {
      this.menuBgm.stop();
    }
    this.gameBgm.play();

    // Iniciar lógica de juego
    this.nextPhraseData = this.getRandomPhrase();
    this.spawnPhrase();

    const isMobile = this.scale.width < 1024;
    if (isMobile) {
      this.setupVirtualKeyboard();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const selectSource = document.getElementById("select-source");
  const selectTarget = document.getElementById("select-target");

  function updateLanguageOptions() {
    const sourceValue = selectSource.value;
    const targetValue = selectTarget.value;

    // 1. Recorrer las opciones del selector de Destino
    Array.from(selectTarget.options).forEach((option) => {
      // Deshabilitar la opción si ya está seleccionada en el Origen
      if (option.value === sourceValue) {
        option.disabled = true;
        option.style.display = "none"; // Ocultar para que sea más limpio
      } else {
        option.disabled = false;
        option.style.display = "block";
      }
    });

    // 2. Recorrer las opciones del selector de Origen
    Array.from(selectSource.options).forEach((option) => {
      // Deshabilitar la opción si ya está seleccionada en el Destino
      if (option.value === targetValue) {
        option.disabled = true;
        option.style.display = "none";
      } else {
        option.disabled = false;
        option.style.display = "block";
      }
    });

    // 3. Si por el cambio el usuario tiene el mismo en ambos, forzar un cambio
    if (sourceValue === targetValue) {
      // Buscar la primera opción no deshabilitada en el target y seleccionarla
      const nextAvailable = Array.from(selectTarget.options).find((opt) => !opt.disabled);
      if (nextAvailable) selectTarget.value = nextAvailable.value;
    }
  }

  // Escuchar cambios en ambos selectores
  selectSource.addEventListener("change", updateLanguageOptions);
  selectTarget.addEventListener("change", updateLanguageOptions);

  // Ejecutar una vez al inicio para configurar el estado inicial
  updateLanguageOptions();
});
