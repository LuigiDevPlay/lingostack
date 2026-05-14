const CACHE_NAME = "lingostack-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./game.html",
  "./src/js/main.js",
  "./src/js/scenes/boot.js",
  "./src/js/scenes/game.js",
  "./src/css/styles.css",
  "./src/data/basico_100.json",
  "./src/data/normal_100.json",
  "./src/data/pro_100.json",
  "./src/assets/sounds/bgm_game.mp3",
  "./src/assets/sounds/bgm_menu.mp3",
  "./src/assets/sounds/click.mp3",
  "./src/assets/sounds/click_1.mp3",
  "./src/assets/sounds/correct.mp3",
  "./src/assets/sounds/error.mp3",
  "./src/assets/sounds/gameover.mp3",
  "./src/assets/sounds/hover_1.mp3",
  "./src/assets/sounds/hover.mp3",
  "./src/assets/sounds/start.mp3",
  "./src/assets/sounds/thud.mp3",
];

// Instalar y guardar archivos en caché
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// Responder desde el caché cuando no hay red
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
