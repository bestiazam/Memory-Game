// ===================================================
// Qaranlıq rejim (bütün səhifələrdə işləyir)
//
// İdeya: <body> elementinə "dark" sinfi əlavə edirik.
// CSS-də body.dark üçün rəng dəyişənləri dəyişir,
// ona görə bütün sayt avtomatik tünd rəngə keçir.
// Seçim localStorage-də saxlanılır ki, başqa səhifəyə
// keçəndə və ya saytı yenidən açanda yadda qalsın.
// ===================================================

const darkBtn = document.getElementById("dark-toggle");

// Səhifə açılanda əvvəlki seçimi yoxlayırıq
if (localStorage.getItem("rejim") === "qaranliq") {
  document.body.classList.add("dark");
}

// Düymənin üzərindəki işarəni yeniləyirik
function updateDarkButton() {
  const isDark = document.body.classList.contains("dark");
  darkBtn.textContent = isDark ? "☀️" : "🌙";
}

// Düyməyə klik olunanda rejimi dəyişirik
darkBtn.addEventListener("click", function () {
  document.body.classList.toggle("dark");   // varsa sil, yoxdursa əlavə et

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("rejim", isDark ? "qaranliq" : "isiqli");
  updateDarkButton();
});

updateDarkButton();
