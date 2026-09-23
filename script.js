import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyC8XupQpKTtgQcz6pnCReJiZutlgw62yvk",
  authDomain: "joel-libina-wedding-52cf7.firebaseapp.com",
  projectId: "joel-libina-wedding-52cf7",
  storageBucket: "joel-libina-wedding-52cf7.firebasestorage.app",
  messagingSenderId: "630651037453",
  appId: "1:630651037453:web:0fb82dd7317e52af05f244"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ---------------- Countdown ----------------

const weddingDate =
  new Date("2027-01-03T11:00:00+05:30").getTime();

function updateCountdown() {
  const daysEl =
    document.getElementById("days");

  if (!daysEl) return;

  let distance =
    weddingDate - Date.now();

  if (distance < 0) {
    distance = 0;
  }

  const days =
    Math.floor(distance / 86400000);

  const hours =
    Math.floor((distance / 3600000) % 24);

  const minutes =
    Math.floor((distance / 60000) % 60);

  const seconds =
    Math.floor((distance / 1000) % 60);

  daysEl.textContent =
    days;

  document.getElementById("hours").textContent =
    String(hours).padStart(2, "0");

  document.getElementById("minutes").textContent =
    String(minutes).padStart(2, "0");

  document.getElementById("seconds").textContent =
    String(seconds).padStart(2, "0");
}

updateCountdown();

setInterval(
  updateCountdown,
  1000
);


// ---------------- Hero slideshow ----------------

const heroSlides = [
  ...document.querySelectorAll(
    ".hero-slide"
  )
];

const heroPrev =
  document.getElementById(
    "heroPrev"
  );

const heroNext =
  document.getElementById(
    "heroNext"
  );

let heroIndex = 0;
let heroTimer = null;
let heroTransitionTimer = null;
let heroTransitioning = false;


heroSlides.forEach(
  (slide, index) => {
    const src =
      slide.dataset.src;

    if (!src) return;

    // Hero #1 is already requested directly by the HTML
    // so it can paint immediately without waiting for JS/Firebase.
    if (index === 0) return;

    const loadImage = () => {
      const preloader =
        new Image();

      preloader.onload =
        () => {
          slide.style.backgroundImage =
            `url("${src}")`;
        };

      preloader.onerror =
        () => {
          console.error(
            "Unable to load hero image:",
            src
          );
        };

      preloader.src =
        src;
    };

    // Let the first visible screen get priority, then prepare
    // the remaining slideshow images in the background.
    if (
      "requestIdleCallback" in window
    ) {
      window.requestIdleCallback(
        loadImage,
        { timeout: 2500 }
      );
    } else {
      window.setTimeout(
        loadImage,
        1200
      );
    }
  }
);


function showHeroSlide(
  index,
  immediate = false
) {
  if (!heroSlides.length) {
    return;
  }

  const nextIndex =
    (
      index +
      heroSlides.length
    ) %
    heroSlides.length;

  const currentSlide =
    heroSlides[
      heroIndex
    ];

  const nextSlide =
    heroSlides[
      nextIndex
    ];

  if (
    immediate ||
    nextIndex === heroIndex
  ) {
    heroSlides.forEach(
      (
        slide,
        i
      ) => {
        slide.classList.toggle(
          "active",
          i === nextIndex
        );
      }
    );

    heroIndex =
      nextIndex;

    heroTransitioning =
      false;

    return;
  }

  if (
    heroTransitioning
  ) {
    return;
  }

  heroTransitioning =
    true;

  // Fade the outgoing image first to reduce
  // the double-exposure effect during transitions.
  currentSlide?.classList.remove(
    "active"
  );

  clearTimeout(
    heroTransitionTimer
  );

  heroTransitionTimer =
    window.setTimeout(
      () => {
        heroSlides.forEach(
          (slide) => {
            slide.classList.remove(
              "active"
            );
          }
        );

        nextSlide?.classList.add(
          "active"
        );

        heroIndex =
          nextIndex;

        window.setTimeout(
          () => {
            heroTransitioning =
              false;
          },
          580
        );
      },
      360
    );
}


function resetHeroTimer() {
  if (heroTimer) {
    clearInterval(
      heroTimer
    );
  }

  if (
    heroSlides.length > 1
  ) {
    heroTimer =
      window.setInterval(
        () =>
          showHeroSlide(
            heroIndex + 1
          ),
        6000
      );
  }
}


showHeroSlide(
  0,
  true
);


heroPrev?.addEventListener(
  "click",
  () => {
    showHeroSlide(
      heroIndex - 1
    );

    resetHeroTimer();
  }
);


heroNext?.addEventListener(
  "click",
  () => {
    showHeroSlide(
      heroIndex + 1
    );

    resetHeroTimer();
  }
);


resetHeroTimer();


// ---------------- Wedding music ----------------

const weddingAudio =
  document.getElementById(
    "weddingAudio"
  );

const musicToggle =
  document.getElementById(
    "musicToggle"
  );

const musicPreferenceKey =
  "joel-libina-music-preference";

const musicTimeKey =
  "joel-libina-music-time";


function setMusicButton(
  isPlaying
) {
  if (!musicToggle) {
    return;
  }

  musicToggle.textContent =
    isPlaying
      ? "❚❚"
      : "♪";

  musicToggle.setAttribute(
    "aria-label",
    isPlaying
      ? "Pause wedding music"
      : "Play wedding music"
  );

  musicToggle.classList.toggle(
    "playing",
    isPlaying
  );
}


function saveMusicState(
  preference
) {
  try {
    localStorage.setItem(
      musicPreferenceKey,
      preference
    );

    if (
      weddingAudio &&
      Number.isFinite(
        weddingAudio.currentTime
      )
    ) {
      localStorage.setItem(
        musicTimeKey,
        String(
          weddingAudio.currentTime
        )
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "Could not save music preference:",
      error
    );
  }
}


function restoreMusicTime() {
  if (!weddingAudio) {
    return;
  }

  try {
    const savedTime =
      Number(
        localStorage.getItem(
          musicTimeKey
        )
      );

    if (
      Number.isFinite(
        savedTime
      ) &&
      savedTime > 0
    ) {
      weddingAudio.currentTime =
        savedTime;
    }
  } catch (
    error
  ) {
    console.warn(
      "Could not restore music position:",
      error
    );
  }
}


async function tryPlayMusic() {
  if (!weddingAudio) {
    return;
  }

  let preference =
    null;

  try {
    preference =
      localStorage.getItem(
        musicPreferenceKey
      );
  } catch {
    preference = null;
  }

  if (
    preference ===
    "paused"
  ) {
    setMusicButton(
      false
    );

    return;
  }

  try {
    await weddingAudio.play();

    setMusicButton(
      true
    );

    saveMusicState(
      "playing"
    );
  } catch {
    setMusicButton(
      false
    );
  }
}


weddingAudio?.addEventListener(
  "loadedmetadata",
  restoreMusicTime,
  {
    once: true
  }
);


window.addEventListener(
  "load",
  tryPlayMusic,
  {
    once: true
  }
);


musicToggle?.addEventListener(
  "click",
  async () => {
    if (!weddingAudio) {
      return;
    }

    if (
      weddingAudio.paused
    ) {
      try {
        await weddingAudio.play();

        setMusicButton(
          true
        );

        saveMusicState(
          "playing"
        );
      } catch {
        showToast(
          "Tap again to start the music."
        );
      }
    } else {
      weddingAudio.pause();

      setMusicButton(
        false
      );

      saveMusicState(
        "paused"
      );
    }
  }
);


weddingAudio?.addEventListener(
  "play",
  () =>
    setMusicButton(
      true
    )
);


weddingAudio?.addEventListener(
  "pause",
  () =>
    setMusicButton(
      false
    )
);


let lastMusicSaveSecond =
  -1;


weddingAudio?.addEventListener(
  "timeupdate",
  () => {
    const currentSecond =
      Math.floor(
        weddingAudio.currentTime
      );

    if (
      currentSecond !==
        lastMusicSaveSecond &&
      currentSecond % 5 === 0
    ) {
      lastMusicSaveSecond =
        currentSecond;

      saveMusicState(
        weddingAudio.paused
          ? "paused"
          : "playing"
      );
    }
  }
);


window.addEventListener(
  "pagehide",
  () => {
    if (
      weddingAudio
    ) {
      saveMusicState(
        weddingAudio.paused
          ? "paused"
          : "playing"
      );
    }
  }
);


// ---------------- Pause music while highlights video plays ----------------

const highlightsVideo =
  document.getElementById(
    "highlightsVideo"
  );

let musicWasPlayingBeforeVideo =
  false;


highlightsVideo?.addEventListener(
  "play",
  () => {
    if (!weddingAudio) {
      return;
    }

    musicWasPlayingBeforeVideo =
      !weddingAudio.paused;

    if (
      musicWasPlayingBeforeVideo
    ) {
      weddingAudio.pause();
    }
  }
);


async function resumeMusicAfterVideo() {
  if (
    !weddingAudio ||
    !musicWasPlayingBeforeVideo
  ) {
    return;
  }

  try {
    await weddingAudio.play();
  } catch (
    error
  ) {
    console.log(
      "Music resume blocked:",
      error
    );
  } finally {
    musicWasPlayingBeforeVideo =
      false;
  }
}


highlightsVideo?.addEventListener(
  "pause",
  resumeMusicAfterVideo
);


highlightsVideo?.addEventListener(
  "ended",
  resumeMusicAfterVideo
);


// ---------------- Our Story ----------------

const storyReadMore =
  document.getElementById(
    "storyReadMore"
  );

const storyMore =
  document.getElementById(
    "storyMore"
  );


storyReadMore?.addEventListener(
  "click",
  () => {
    const isOpen =
      storyReadMore.getAttribute(
        "aria-expanded"
      ) === "true";

    storyReadMore.setAttribute(
      "aria-expanded",
      String(
        !isOpen
      )
    );

    if (
      storyMore
    ) {
      storyMore.hidden =
        isOpen;
    }

    storyReadMore.textContent =
      isOpen
        ? "Read More"
        : "Read Less";
  }
);


// ---------------- Common modal helpers ----------------

const toast =
  document.getElementById(
    "toast"
  );


function showToast(
  message
) {
  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () =>
        toast.classList.remove(
          "show"
        ),
      3000
    );
}


function openModal(
  modal
) {
  if (!modal) {
    return;
  }

  modal.classList.add(
    "open"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );
}


function closeModal(
  modal
) {
  if (!modal) {
    return;
  }

  modal.classList.remove(
    "open"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  if (
    !document.querySelector(
      ".modal.open"
    )
  ) {
    document.body.classList.remove(
      "modal-open"
    );
  }
}


// ---------------- Invitation card ----------------

const invitationModal =
  document.getElementById(
    "invitationCardModal"
  );

const invitationCardImage =
  document.getElementById(
    "invitationCardImage"
  );

const invitationCardPlaceholder =
  document.getElementById(
    "invitationCardPlaceholder"
  );


if (
  invitationCardImage
) {
  invitationCardImage.addEventListener(
    "load",
    () => {
      invitationCardImage.style.display =
        "block";

      if (
        invitationCardPlaceholder
      ) {
        invitationCardPlaceholder.style.display =
          "none";
      }
    }
  );

  invitationCardImage.addEventListener(
    "error",
    () => {
      invitationCardImage.style.display =
        "none";

      if (
        invitationCardPlaceholder
      ) {
        invitationCardPlaceholder.style.display =
          "flex";
      }
    }
  );
}


document
  .querySelectorAll(
    "[data-close-invitation]"
  )
  .forEach(
    (
      element
    ) => {
      element.addEventListener(
        "click",
        () =>
          closeModal(
            invitationModal
          )
      );
    }
  );


// ---------------- Firebase greetings ----------------

const greetingsModal =
  document.getElementById(
    "greetingsModal"
  );

const greetingForm =
  document.getElementById(
    "greetingForm"
  );

const guestMessages =
  document.getElementById(
    "guestMessages"
  );

const openGreetings =
  document.getElementById(
    "openGreetings"
  );

const greetingSubmit =
  document.getElementById(
    "greetingSubmit"
  );


function renderGreetingDocs(
  docs
) {
  if (!guestMessages) {
    return;
  }

  guestMessages.innerHTML =
    "";

  if (!docs.length) {
    guestMessages.innerHTML =
      '<p class="empty-greetings">Be the first to leave Joel & Libina a message.</p>';

    return;
  }

  docs.forEach(
    (
      docSnap
    ) => {
      const item =
        docSnap.data();

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "guest-message-card";


      const message =
        document.createElement(
          "p"
        );

      message.textContent =
        item.message ||
        "";


      const name =
        document.createElement(
          "strong"
        );

      name.textContent =
        `— ${item.name || "Guest"}`;


      const meta =
        document.createElement(
          "div"
        );

      meta.className =
        "greeting-meta";


      const timestamp =
        item.createdAt?.toDate?.();


      meta.textContent =
        timestamp
          ? timestamp.toLocaleDateString(
              undefined,
              {
                month:
                  "short",
                day:
                  "numeric",
                year:
                  "numeric"
              }
            )
          : "Just now";


      card.append(
        message,
        name,
        meta
      );


      guestMessages.appendChild(
        card
      );
    }
  );
}


try {
  const greetingsQuery =
    query(
      collection(
        db,
        "greetings"
      ),
      orderBy(
        "createdAt",
        "desc"
      ),
      limit(
        50
      )
    );


  onSnapshot(
    greetingsQuery,
    (
      snapshot
    ) => {
      renderGreetingDocs(
        snapshot.docs
      );
    },
    (
      error
    ) => {
      console.error(
        "Greeting feed error:",
        error
      );

      if (
        guestMessages
      ) {
        guestMessages.innerHTML =
          '<p class="empty-greetings">Greetings are temporarily unavailable.</p>';
      }
    }
  );
} catch (
  error
) {
  console.error(
    "Firebase greeting setup error:",
    error
  );
}


openGreetings?.addEventListener(
  "click",
  () => {
    openModal(
      greetingsModal
    );

    setTimeout(
      () =>
        document
          .getElementById(
            "guestName"
          )
          ?.focus(),
      50
    );
  }
);


document
  .querySelectorAll(
    "[data-close-modal]"
  )
  .forEach(
    (
      element
    ) => {
      element.addEventListener(
        "click",
        () =>
          closeModal(
            greetingsModal
          )
      );
    }
  );


greetingForm?.addEventListener(
  "submit",
  async (
    event
  ) => {
    event.preventDefault();

    const name =
      document
        .getElementById(
          "guestName"
        )
        .value
        .trim();

    const message =
      document
        .getElementById(
          "guestMessage"
        )
        .value
        .trim();

    if (
      !name ||
      !message
    ) {
      return;
    }

    if (
      greetingSubmit
    ) {
      greetingSubmit.disabled =
        true;

      greetingSubmit.textContent =
        "Posting…";
    }

    try {
      await addDoc(
        collection(
          db,
          "greetings"
        ),
        {
          name,
          message,
          createdAt:
            serverTimestamp()
        }
      );

      greetingForm.reset();

      closeModal(
        greetingsModal
      );

      document
        .getElementById(
          "blessings"
        )
        ?.scrollIntoView(
          {
            behavior:
              "smooth",
            block:
              "start"
          }
        );

      showToast(
        "Your greeting has been added."
      );
    } catch (
      error
    ) {
      console.error(
        "Greeting submit error:",
        error
      );

      showToast(
        "Could not post your greeting. Please try again."
      );
    } finally {
      if (
        greetingSubmit
      ) {
        greetingSubmit.disabled =
          false;

        greetingSubmit.textContent =
          "Post Greeting";
      }
    }
  }
);


// ---------------- Firebase RSVP ----------------

const rsvpModal =
  document.getElementById(
    "rsvpModal"
  );

const rsvpForm =
  document.getElementById(
    "rsvpForm"
  );

const rsvpAttendance =
  document.getElementById(
    "rsvpAttendance"
  );

const rsvpGuestCount =
  document.getElementById(
    "rsvpGuestCount"
  );

const rsvpSubmit =
  document.getElementById(
    "rsvpSubmit"
  );

const rsvpFormView =
  document.getElementById(
    "rsvpFormView"
  );

const rsvpSuccess =
  document.getElementById(
    "rsvpSuccess"
  );

const rsvpSuccessMessage =
  document.getElementById(
    "rsvpSuccessMessage"
  );

const rsvpDone =
  document.getElementById(
    "rsvpDone"
  );


function resetRsvpView() {
  if (
    rsvpFormView
  ) {
    rsvpFormView.hidden =
      false;
  }

  if (
    rsvpSuccess
  ) {
    rsvpSuccess.hidden =
      true;
  }
}


function openRsvpModal() {
  resetRsvpView();

  openModal(
    rsvpModal
  );

  setTimeout(
    () =>
      document
        .getElementById(
          "rsvpName"
        )
        ?.focus(),
    50
  );
}


document
  .querySelectorAll(
    "[data-close-rsvp]"
  )
  .forEach(
    (
      element
    ) => {
      element.addEventListener(
        "click",
        () => {
          closeModal(
            rsvpModal
          );

          setTimeout(
            resetRsvpView,
            200
          );
        }
      );
    }
  );


rsvpDone?.addEventListener(
  "click",
  () => {
    closeModal(
      rsvpModal
    );

    setTimeout(
      resetRsvpView,
      200
    );
  }
);


rsvpAttendance?.addEventListener(
  "change",
  () => {
    const attending =
      rsvpAttendance.value ===
      "yes";

    if (
      rsvpGuestCount
    ) {
      rsvpGuestCount.value =
        attending
          ? Math.max(
              1,
              Number(
                rsvpGuestCount.value
              ) || 1
            )
          : 0;

      rsvpGuestCount.disabled =
        !attending;
    }
  }
);


rsvpForm?.addEventListener(
  "submit",
  async (
    event
  ) => {
    event.preventDefault();

    const name =
      document
        .getElementById(
          "rsvpName"
        )
        .value
        .trim();

    const attendance =
      rsvpAttendance.value;

    const guestCount =
      attendance ===
      "yes"
        ? Number(
            rsvpGuestCount.value
          )
        : 0;

    const message =
      document
        .getElementById(
          "rsvpMessage"
        )
        .value
        .trim();

    if (
      !name ||
      !attendance ||
      !Number.isInteger(
        guestCount
      ) ||
      guestCount < 0 ||
      guestCount > 10
    ) {
      return;
    }

    if (
      rsvpSubmit
    ) {
      rsvpSubmit.disabled =
        true;

      rsvpSubmit.textContent =
        "Submitting…";
    }

    try {
      await addDoc(
        collection(
          db,
          "rsvps"
        ),
        {
          name,
          attendance,
          guestCount,
          message,
          createdAt:
            serverTimestamp()
        }
      );

      const attending =
        attendance ===
        "yes";

      rsvpForm.reset();

      if (
        rsvpGuestCount
      ) {
        rsvpGuestCount.disabled =
          false;

        rsvpGuestCount.value =
          1;
      }

      if (
        rsvpSuccessMessage
      ) {
        rsvpSuccessMessage.textContent =
          attending
            ? `Thank you, ${name}. We can’t wait to celebrate with you!`
            : `Thank you, ${name}. We’ll miss you and appreciate you letting us know.`;
      }

      if (
        rsvpFormView
      ) {
        rsvpFormView.hidden =
          true;
      }

      if (
        rsvpSuccess
      ) {
        rsvpSuccess.hidden =
          false;
      }
    } catch (
      error
    ) {
      console.error(
        "RSVP submit error:",
        error
      );

      showToast(
        "Could not submit your RSVP. Please try again."
      );
    } finally {
      if (
        rsvpSubmit
      ) {
        rsvpSubmit.disabled =
          false;

        rsvpSubmit.textContent =
          "Submit RSVP";
      }
    }
  }
);


// ---------------- Action tiles ----------------

document
  .querySelectorAll(
    ".action-tile"
  )
  .forEach(
    (
      button
    ) => {
      button.addEventListener(
        "click",
        () => {
          const action =
            button.dataset.action;

          if (
            action ===
            "invitation"
          ) {
            openModal(
              invitationModal
            );

            return;
          }

          if (
            action ===
            "greetings"
          ) {
            openModal(
              greetingsModal
            );

            setTimeout(
              () =>
                document
                  .getElementById(
                    "guestName"
                  )
                  ?.focus(),
              50
            );

            return;
          }

          if (
            action ===
            "livestream"
          ) {
            showToast(
              "Live streaming details will be added soon."
            );

            return;
          }

          if (
            action ===
            "rsvp"
          ) {
            openRsvpModal();
          }
        }
      );
    }
  );


// ---------------- Gallery + lightbox ----------------

const galleryItems = [
  ...document.querySelectorAll(
    ".gallery-item"
  )
];

const lightbox =
  document.getElementById(
    "galleryLightbox"
  );

const lightboxImage =
  document.getElementById(
    "lightboxImage"
  );

const lightboxCounter =
  document.getElementById(
    "lightboxCounter"
  );

const galleryPrev =
  document.getElementById(
    "galleryPrev"
  );

const galleryNext =
  document.getElementById(
    "galleryNext"
  );

let availableGalleryImages =
  [];

let galleryIndex =
  0;

let touchStartX =
  0;


function refreshGalleryImages() {
  availableGalleryImages =
    galleryItems
      .filter(
        (
          item
        ) =>
          item.classList.contains(
            "has-image"
          )
      )
      .map(
        (
          item
        ) =>
          item.querySelector(
            "img"
          )
      );
}


function showGalleryImage(
  index
) {
  refreshGalleryImages();

  if (
    !availableGalleryImages.length ||
    !lightboxImage
  ) {
    return;
  }

  galleryIndex =
    (
      index +
      availableGalleryImages.length
    ) %
    availableGalleryImages.length;

  const source =
    availableGalleryImages[
      galleryIndex
    ];

  lightboxImage.src =
    source.src;

  lightboxImage.alt =
    source.alt;

  if (
    lightboxCounter
  ) {
    lightboxCounter.textContent =
      `${galleryIndex + 1} / ${availableGalleryImages.length}`;
  }
}


// Gentle reveal animation for gallery photos

if (
  "IntersectionObserver" in
  window
) {
  const galleryObserver =
    new IntersectionObserver(
      (
        entries,
        observer
      ) => {
        entries.forEach(
          (
            entry
          ) => {
            if (
              !entry.isIntersecting
            ) {
              return;
            }

            const item =
              entry.target;

            const index =
              galleryItems.indexOf(
                item
              );

            window.setTimeout(
              () =>
                item.classList.add(
                  "gallery-visible"
                ),
              Math.max(
                index,
                0
              ) * 70
            );

            observer.unobserve(
              item
            );
          }
        );
      },
      {
        threshold:
          0.12
      }
    );

  galleryItems.forEach(
    (
      item
    ) =>
      galleryObserver.observe(
        item
      )
  );
} else {
  galleryItems.forEach(
    (
      item
    ) =>
      item.classList.add(
        "gallery-visible"
      )
  );
}


galleryItems.forEach(
  (
    item
  ) => {
    const img =
      item.querySelector(
        "img"
      );

    if (!img) {
      return;
    }

    img.addEventListener(
      "load",
      () => {
        item.classList.add(
          "has-image"
        );

        refreshGalleryImages();
      }
    );

    img.addEventListener(
      "error",
      () => {
        img.style.display =
          "none";

        item.classList.remove(
          "has-image"
        );

        refreshGalleryImages();
      }
    );

    item.addEventListener(
      "click",
      () => {
        if (
          !item.classList.contains(
            "has-image"
          )
        ) {
          return;
        }

        refreshGalleryImages();

        const index =
          availableGalleryImages.indexOf(
            img
          );

        showGalleryImage(
          index
        );

        openModal(
          lightbox
        );
      }
    );
  }
);


galleryPrev?.addEventListener(
  "click",
  () =>
    showGalleryImage(
      galleryIndex - 1
    )
);


galleryNext?.addEventListener(
  "click",
  () =>
    showGalleryImage(
      galleryIndex + 1
    )
);


document
  .querySelectorAll(
    "[data-close-gallery]"
  )
  .forEach(
    (
      element
    ) => {
      element.addEventListener(
        "click",
        () =>
          closeModal(
            lightbox
          )
      );
    }
  );


lightboxImage?.addEventListener(
  "touchstart",
  (
    event
  ) => {
    touchStartX =
      event.changedTouches[0]
        .screenX;
  },
  {
    passive: true
  }
);


lightboxImage?.addEventListener(
  "touchend",
  (
    event
  ) => {
    const delta =
      event.changedTouches[0]
        .screenX -
      touchStartX;

    if (
      Math.abs(
        delta
      ) < 45
    ) {
      return;
    }

    showGalleryImage(
      delta > 0
        ? galleryIndex - 1
        : galleryIndex + 1
    );
  },
  {
    passive: true
  }
);


// ---------------- Add all wedding events to calendar ----------------

const addCalendar =
  document.getElementById(
    "addCalendar"
  );


function downloadCalendarFile() {
  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Joel and Libina Wedding//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:engagement-20261231@joel-libina-wedding
DTSTAMP:20260915T120000Z
DTSTART:20261231T060000Z
DTEND:20261231T080000Z
SUMMARY:Joel & Libina - Engagement
LOCATION:St. Thomas Marthoma Church Auditorium, Kavungumprayar, Puramattom, Kerala, India
END:VEVENT
BEGIN:VEVENT
UID:wedding-20270103@joel-libina-wedding
DTSTAMP:20260915T120000Z
DTSTART:20270103T053000Z
DTEND:20270103T073000Z
SUMMARY:Joel & Libina - Wedding Ceremony
LOCATION:Mar Lazarus Orthodox Valiyapally, Pathanapuram, Kerala, India
END:VEVENT
BEGIN:VEVENT
UID:reception-20270103@joel-libina-wedding
DTSTAMP:20260915T120000Z
DTSTART:20270103T093000Z
DTEND:20270103T123000Z
SUMMARY:Joel & Libina - Wedding Reception
LOCATION:Morning Star Convention Center, Elamanoor, Kerala, India
END:VEVENT
END:VCALENDAR`;

  const blob =
    new Blob(
      [
        ics.replace(
          /\n/g,
          "\r\n"
        )
      ],
      {
        type:
          "text/calendar;charset=utf-8"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href =
    url;

  link.download =
    "joel-libina-wedding-events.ics";

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );
}


addCalendar?.addEventListener(
  "click",
  downloadCalendarFile
);


// ---------------- Gentle scroll reveals ----------------

const revealTargets = [
  ...document.querySelectorAll(
    ".section-heading, .bio-card, .story-card, .event-card-main, .video-card, .action-tile, .verse-card, .guest-messages, .closing-section"
  )
];

const reduceMotion =
  window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches;


if (
  reduceMotion ||
  !(
    "IntersectionObserver" in
    window
  )
) {
  revealTargets.forEach(
    (
      element
    ) =>
      element.classList.add(
        "revealed"
      )
  );
} else {
  revealTargets.forEach(
    (
      element
    ) =>
      element.classList.add(
        "reveal-target"
      )
  );

  const revealObserver =
    new IntersectionObserver(
      (
        entries,
        observer
      ) => {
        entries.forEach(
          (
            entry
          ) => {
            if (
              !entry.isIntersecting
            ) {
              return;
            }

            entry.target.classList.add(
              "revealed"
            );

            observer.unobserve(
              entry.target
            );
          }
        );
      },
      {
        threshold:
          0.12,
        rootMargin:
          "0px 0px -5% 0px"
      }
    );

  revealTargets.forEach(
    (
      element
    ) =>
      revealObserver.observe(
        element
      )
  );
}


// ---------------- Keyboard close/navigation ----------------

document.addEventListener(
  "keydown",
  (
    event
  ) => {
    if (
      event.key ===
      "Escape"
    ) {
      closeModal(
        greetingsModal
      );

      closeModal(
        invitationModal
      );

      closeModal(
        rsvpModal
      );

      closeModal(
        lightbox
      );
    }

    if (
      lightbox?.classList.contains(
        "open"
      )
    ) {
      if (
        event.key ===
        "ArrowLeft"
      ) {
        showGalleryImage(
          galleryIndex - 1
        );
      }

      if (
        event.key ===
        "ArrowRight"
      ) {
        showGalleryImage(
          galleryIndex + 1
        );
      }
    }
  }
);
