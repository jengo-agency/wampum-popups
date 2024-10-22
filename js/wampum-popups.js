// Global variable for ouibounce
let _ouibounce;

document.ready = function (readyFn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", readyFn);
  } else {
    readyFn();
  }
};

function show(obj) {
  if (!obj) {
    console.warn("show : obj is null");
    return false;
  }
  if (getComputedStyle(obj).display !== "none") return false;
  if (obj.dataset.displayWas) {
    obj.style.display = obj.dataset.displayWas;
    obj.removeAttribute("data-display-was");
  } else {
    obj.style.display = null;
    if (getComputedStyle(obj).display === "none") {
      console.log("Show : status error for " + obj + ", invalid previous display state. Forcing to revert");
      obj.style.display = "revert";
    }
  }
  return true;
}
function hide(obj) {
  if (!obj) {
    //console.warn("hide : obj is null");
    return false;
  }
  if (getComputedStyle(obj).display == "none") return false;
  if (obj.style.display && obj.style.display != "revert") obj.dataset.displayWas = obj.style.display;
  obj.style.display = "none";
  return true;
}

// Fade functions with consistent transition cleanup
function fadeIn(element, duration = 300) {
  if (!element) {
    console.warn("fadeIn : obj is null");
    return false;
  }
  element.classList.add("fade-in");
  show(element);
  const handleAnimationEnd = () => {
    element.classList.remove("fade-in");
    element.removeEventListener("animationend", handleAnimationEnd);
  };
  element.addEventListener("animationend", handleAnimationEnd);
  return true;
}
function fadeOut(element, duration = 300) {
  if (!element) {
    console.warn("fadeIn : obj is null");
    return false;
  }
  element.classList.add("fade-out");
  const handleAnimationEnd = () => {
    element.style.display = "none";
    element.classList.remove("fade-out");
    element.removeEventListener("animationend", handleAnimationEnd);
  };
  element.addEventListener("animationend", handleAnimationEnd);
  return true;
}

 // Wampum Popups
document.ready(() => {
  "use strict";

  if (typeof wampum_popups_vars === "undefined") {
    console.error("wampum_popups_vars is not defined. Ensure it is localized in your WordPress setup.");
    return;
  }

  document.querySelectorAll(".wampum-popup-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const popupId = link.getAttribute("data-popup");
      const popup = document.querySelector(`#wampum-popup-${popupId}`);
      console.log("[popup] clicking on link, displaying popup " + popupId);
      show(popup);
    });
  });

  document.querySelectorAll(".wampum-popup").forEach((popup) => {
    const index = popup.getAttribute("data-popup");
    const popupVars = wampum_popups_vars[index]?.wampumpopups;
    const ouiVars = wampum_popups_vars[index]?.ouibounce;

    if (!popupVars) {
      console.error(`Popup variables not found for index: ${index}`);
      return;
    }
    //setup potential ouibounce options, Default to an empty object
    const oui = {
      ...(ouiVars || {}),
    };
    // Add class to the popup wrap
    popup.classList.add(`wampum-${popupVars.style}`, `wampum-${popupVars.type}`);

    if (popupVars.type === "gallery") {
      const content = popup.querySelector(".wampum-popup-content");

      // If more than one gallery image, add prev/next buttons
      if (document.querySelectorAll(".gallery-item").length > 1) {
        content.insertAdjacentHTML(
          "afterend",
          `
            <span style="display:none;" class="wampum-popup-button wampum-popup-next"><span class="screen-reader-text">Next</span></span>
            <span style="display:none;" class="wampum-popup-button wampum-popup-prev"><span class="screen-reader-text">Previous</span></span>
          `
        );
      }

      document.querySelectorAll(".gallery-item a").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();

          const src = link.href;
          const alt = link.querySelector("img").alt;

          content.querySelectorAll("img").forEach((img) => img.remove());

          content.insertAdjacentHTML("beforeend", `<img style="width:auto;height:auto;" src="${src}" alt="${alt}"/>`);

          show(popup);

          const img = popup.querySelector("img");

          const prevButton = popup.querySelector(".wampum-popup-prev");
          const nextButton = popup.querySelector(".wampum-popup-next");
          let current = link.closest(".gallery-item");
          let prevItem = current.previousElementSibling;
          let nextItem = current.nextElementSibling;

          if (prevItem) {
            setTimeout(() => show(prevButton), 500);
          } else {
            hide(prevButton);
          }

          if (nextItem) {
            setTimeout(() => show(nextButton), 500);
          } else {
            hide(nextButton);
          }

          img.addEventListener("load", () => resizeContent(img));

          window.addEventListener("resize", () => resizeContent(img));

          prevButton.addEventListener("click", doPreviousItem);
          nextButton.addEventListener("click", doNextItem);

          document.addEventListener("keydown", (e) => {
            switch (e.key) {
              case "ArrowLeft":
                doPreviousItem();
                break;
              case "ArrowRight":
                doNextItem();
                break;
              default:
                return;
            }
            e.preventDefault();
          });

          function doPreviousItem() {
            if (!prevItem || !prevItem.matches(".gallery-item")) return;

            current = prevItem;

            img.src = current.querySelector("a").href;
            img.alt = current.querySelector("img").alt;

            prevItem = current.previousElementSibling;
            nextItem = current.nextElementSibling;

            prevButton.style.display = prevItem ? "block" : "none";
            nextButton.style.display = nextItem ? "block" : "none";
          }

          function doNextItem() {
            if (!nextItem || !nextItem.matches(".gallery-item")) return;

            current = nextItem;

            img.src = current.querySelector("a").href;
            img.alt = current.querySelector("img").alt;

            prevItem = current.previousElementSibling;
            nextItem = current.nextElementSibling;

            prevButton.style.display = prevItem ? "block" : "none";
            nextButton.style.display = nextItem ? "block" : "none";
          }
        });
      });
    }

    if (popupVars.type === "exit") {
      _ouibounce = ouibounce(popup, oui);
    }

    if (popupVars.type === "timed") {
      if (oui.aggressive === "true") {
        show(popup);
      } else {
        _ouibounce = ouibounce(popup, oui);
        setTimeout(() => _ouibounce.fire(), popupVars.time);
      }
    }

    popup.addEventListener("click", (e) => {
      if ( ( e.target.matches( ".wampum-popup-close" ) || e.target.matches( ".wampum-popup-overlay.close-outside" ) ) && !e.target.matches( ".wampum-popup-prev, .wampum-popup-next" ) && !e.target.closest( ".wampum-popup-content" ) ) {
        console.log("[popup] clicking on 'overlay or cross', closing popup ");
        closePopup(popup);
        if (popupVars.close_outside) {
          //const overlay = document.querySelector(".wampum-popup-overlay", popup);
        }
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activePopup = document.querySelector('.wampum-popup[style*="display: block"]');
      if (activePopup) {
        closePopup(activePopup);
      }
      e.preventDefault();
    }
  });

  function resizeContent(element) {
    const parent = element.closest(".wampum-popup-inner");
    if (!parent) return; // Fallback or early exit if no parent is found
    element.style.width = "auto";
    element.style.height = "auto";
    element.style.height = `${parent.offsetHeight}px`;
    element.style.maxHeight = "100%";
    element.style.maxWidth = "100%";
  }

  function closePopup(popup) {
    fadeOut(popup);
    if (_ouibounce) {
      _ouibounce.disable();
    }
    hide(popup.querySelector(".wampum-popup-prev"));
    hide(popup.querySelector(".wampum-popup-next"));
  }
});
