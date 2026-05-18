document.addEventListener("DOMContentLoaded", () => {

  (() => {
    if (localStorage.getItem("lang-selected")) return;
    if (location.pathname.startsWith("/ja")) return;
    const lang = navigator.language || navigator.userLanguage;

    if (lang.startsWith("ja")) {
      location.replace("/ja/");
    }
  })();

});
