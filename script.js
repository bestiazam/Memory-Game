// ===================================================
// 1. Emoji mövzuları (hər mövzuda 10 şəkil var)
// ===================================================
const themes = {
  pisikler:  ["🐱", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"],
  heyvanlar: ["🐶", "🐱", "🦊", "🐼", "🐸", "🦁", "🐵", "🐰", "🐯", "🐨"],
  meyveler:  ["🍓", "🍎", "🍌", "🍇", "🍉", "🍒", "🍍", "🥝", "🍑", "🍋"],
  kosmos:    ["🚀", "🌙", "⭐", "🪐", "☀️", "🌍", "👽", "🛸", "☄️", "🌌"]
};

// Hər cüt sayı üçün neçə sütun olacaq (kompüter və telefon üçün)
const columns       = { 5: 5, 6: 4, 7: 7, 8: 4, 9: 6, 10: 5 };
const columnsMobile = { 5: 5, 6: 4, 7: 4, 8: 4, 9: 6, 10: 5 };

// Başlanğıcda kartlar neçə millisaniyə açıq qalsın (2000 = 2 saniyə)
const PREVIEW_TIME = 2000;

// ===================================================
// 2. Ana səhifədəki formadan gələn seçimləri oxuyuruq
//    (məs. game.html?pairs=8&theme=meyveler)
// ===================================================
const params = new URLSearchParams(window.location.search);

let pairs = parseInt(params.get("pairs")) || 5;
if (pairs < 5 || pairs > 10) pairs = 5;

let theme = params.get("theme");
if (!themes[theme]) theme = "pisikler";

// ===================================================
// 3. HTML elementlərini tapırıq
// ===================================================
const board     = document.getElementById("board");
const movesEl   = document.getElementById("moves");
const timeEl    = document.getElementById("time");
const foundEl   = document.getElementById("found");
const recordEl  = document.getElementById("record");
const messageEl = document.getElementById("message");
const winBox    = document.getElementById("win");
const resultEl  = document.getElementById("result");
const starsEl   = document.getElementById("stars");
const newRecEl  = document.getElementById("new-record");
const soundBtn  = document.getElementById("sound-toggle");

// ===================================================
// 4. Oyunun vəziyyəti (dəyişənlər)
// ===================================================
let firstCard = null;    // açılan birinci kart
let secondCard = null;   // açılan ikinci kart
let locked = false;      // kliklər bağlıdır (yoxlama və ya önizləmə zamanı)
let moves = 0;           // hərəkət sayı
let matched = 0;         // tapılan cüt sayı
let seconds = 0;         // keçən vaxt
let timer = null;        // taymer
let started = false;     // taymer ilk klikdə başlayır
let previewTimeout = null;

// ===================================================
// 5. Massivi qarışdırmaq (Fisher–Yates üsulu)
// ===================================================
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ===================================================
// 6. Oyunu başlatmaq / yenidən başlatmaq
// ===================================================
function startGame() {
  // Hər şeyi sıfırlayırıq
  firstCard = null;
  secondCard = null;
  moves = 0;
  matched = 0;
  seconds = 0;
  started = false;
  clearInterval(timer);
  clearTimeout(previewTimeout);

  movesEl.textContent = 0;
  timeEl.textContent = "00:00";
  foundEl.textContent = "0 / " + pairs;
  winBox.classList.add("hidden");
  showRecord();

  // Mövzudan lazım olan qədər emoji götürürük və hər birini 2 dəfə yazırıq
  const emojis = themes[theme].slice(0, pairs);
  const deck = shuffle([...emojis, ...emojis]);

  // Sütun sayını CSS-ə ötürürük
  board.style.setProperty("--cols", columns[pairs]);
  board.style.setProperty("--cols-mobile", columnsMobile[pairs]);

  // Kartları yaradırıq
  board.innerHTML = "";
  deck.forEach(function (emoji) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.emoji = emoji;
    card.innerHTML =
      '<div class="card-inner">' +
        '<div class="card-back"></div>' +
        '<div class="card-front">' + emoji + '</div>' +
      '</div>';
    card.addEventListener("click", function () {
      flipCard(card);
    });
    board.appendChild(card);
  });

  showPreview();
}

// ===================================================
// 7. YENİ: Başlanğıcda kartları göstərmək (önizləmə)
//    Bütün kartları açırıq, 2 saniyə gözləyib bağlayırıq.
//    Bu müddətdə kliklər bağlıdır (locked = true).
// ===================================================
function showPreview() {
  const allCards = document.querySelectorAll(".card");

  locked = true;
  messageEl.textContent = "👀 Kartları yadda saxla...";
  allCards.forEach(function (card) {
    card.classList.add("flipped");
  });

  previewTimeout = setTimeout(function () {
    allCards.forEach(function (card) {
      card.classList.remove("flipped");
    });
    locked = false;
    messageEl.textContent = "Başla! Cütləri tap 🐾";
  }, PREVIEW_TIME);
}

// ===================================================
// 8. Karta klik olunanda
// ===================================================
function flipCard(card) {
  // Bu hallarda heç nə etmirik:
  if (locked) return;                              // kliklər bağlıdır
  if (card === firstCard) return;                  // eyni karta iki dəfə klik
  if (card.classList.contains("matched")) return;  // artıq tapılıb

  // İlk klikdə taymeri işə salırıq
  if (!started) {
    started = true;
    timer = setInterval(updateTime, 1000);
  }

  card.classList.add("flipped");

  if (firstCard === null) {
    firstCard = card;        // birinci kart açıldı, ikincini gözləyirik
    return;
  }

  secondCard = card;         // ikinci kart açıldı
  moves++;
  movesEl.textContent = moves;
  checkMatch();
}

// ===================================================
// 9. İki kartı müqayisə etmək
// ===================================================
function checkMatch() {
  const same = firstCard.dataset.emoji === secondCard.dataset.emoji;

  if (same) {
    // Cüt tapıldı — kartlar açıq qalır
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    matched++;
    foundEl.textContent = matched + " / " + pairs;
    playMeow();
    resetTurn();

    if (matched === pairs) {
      endGame();
    }
  } else {
    // Səhv cüt — bir az gözləyib kartları bağlayırıq
    locked = true;
    firstCard.classList.add("wrong");
    secondCard.classList.add("wrong");

    setTimeout(function () {
      firstCard.classList.remove("flipped", "wrong");
      secondCard.classList.remove("flipped", "wrong");
      resetTurn();
    }, 900);
  }
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  locked = false;
}

// ===================================================
// 10. Taymer
// ===================================================
function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return m + ":" + s;
}

function updateTime() {
  seconds++;
  timeEl.textContent = formatTime(seconds);
}

// ===================================================
// 11. YENİ: Ulduz reytinqi
//     Ən az mümkün hərəkət sayı = cüt sayı (heç səhv etmədən).
//     Bu rəqəmə nə qədər yaxınsansa, o qədər çox ulduz alırsan.
// ===================================================
function getStars() {
  if (moves <= pairs * 1.5) return 3;   // məs. 8 cütdə 12 hərəkətə qədər
  if (moves <= pairs * 2)   return 2;   // məs. 8 cütdə 16 hərəkətə qədər
  return 1;
}

function showStars(count) {
  starsEl.innerHTML = "";
  for (let i = 1; i <= 3; i++) {
    const star = document.createElement("span");
    star.textContent = "⭐";
    // Qazanılmayan ulduzlar solğun görünür
    if (i > count) star.className = "star-empty";
    starsEl.appendChild(star);
  }
}

// ===================================================
// 12. YENİ: Rekord (localStorage)
//     localStorage — brauzerin içində kiçik "yaddaş"dır.
//     Səhifəni bağlayıb açsan da məlumat orada qalır.
//     Hər cüt sayının öz rekordu var: "rekord-5", "rekord-6" ...
// ===================================================
function getRecord() {
  const saved = localStorage.getItem("rekord-" + pairs);
  if (saved === null) return null;     // hələ rekord yoxdur
  return JSON.parse(saved);            // mətndən obyektə çeviririk
}

function saveRecord() {
  const data = { moves: moves, seconds: seconds };
  // localStorage yalnız mətn saxlayır, ona görə JSON mətninə çeviririk
  localStorage.setItem("rekord-" + pairs, JSON.stringify(data));
}

// Yeni nəticə rekorddan yaxşıdırmı? (az hərəkət, bərabərdirsə az vaxt)
function isNewRecord() {
  const record = getRecord();
  if (record === null) return true;
  if (moves < record.moves) return true;
  if (moves === record.moves && seconds < record.seconds) return true;
  return false;
}

function showRecord() {
  const record = getRecord();
  if (record === null) {
    recordEl.textContent = "—";
  } else {
    recordEl.textContent = record.moves + " hər.";
  }
}

// ===================================================
// 13. YENİ: Səs (miyav)
//     Səs açıq/bağlı seçimi də localStorage-də saxlanılır.
// ===================================================
const meow = new Audio("sounds/miyav.mp3");
let soundOn = localStorage.getItem("ses") !== "bagli";   // standart: açıq

function updateSoundButton() {
  soundBtn.textContent = soundOn ? "🔊 Səs: açıq" : "🔇 Səs: bağlı";
}

function playMeow() {
  if (!soundOn) return;
  meow.currentTime = 0;   // səsi əvvəldən başladırıq
  meow.play();
}

soundBtn.addEventListener("click", function () {
  soundOn = !soundOn;     // açıqdırsa bağla, bağlıdırsa aç
  localStorage.setItem("ses", soundOn ? "acig" : "bagli");
  updateSoundButton();
});

// ===================================================
// 14. Oyunun sonu
// ===================================================
function endGame() {
  clearInterval(timer);
  messageEl.textContent = "Afərin! 🎉";

  resultEl.textContent =
    pairs + " cüt · " + moves + " hərəkət · " + formatTime(seconds);
  showStars(getStars());

  // Rekordu yoxlayırıq
  if (isNewRecord()) {
    saveRecord();
    newRecEl.classList.remove("hidden");
  } else {
    newRecEl.classList.add("hidden");
  }
  showRecord();

  // Qələbə pəncərəsini bir az gecikmə ilə göstəririk
  setTimeout(function () {
    winBox.classList.remove("hidden");
  }, 600);
}

// ===================================================
// 15. Düymələr və oyunun başlanması
// ===================================================
document.getElementById("restart").addEventListener("click", startGame);
document.getElementById("play-again").addEventListener("click", startGame);

updateSoundButton();
startGame();
