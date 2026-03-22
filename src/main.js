import gsap from "gsap";
import confetti from "canvas-confetti";

import { Howl } from "howler";

import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import smokeVertexShader from "./shaders/smoke/vertex.glsl";
import smokeFragmentShader from "./shaders/smoke/fragment.glsl";
import themeVertexShader from "./shaders/theme/vertex.glsl";
import themeFragmentShader from "./shaders/theme/fragment.glsl";

/** --------------------- Custom Cursor & Interactive UI --------------------- */
const cursor = document.querySelector('.custom-cursor');
let cursorX = 0, cursorY = 0, mouseX = 0, mouseY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  cursorX += (mouseX - cursorX) * 0.2;
  cursorY += (mouseY - cursorY) * 0.2;
  if(cursor) cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Magnetic Button Effects
document.addEventListener('DOMContentLoaded', () => {
  const interactiveElements = document.querySelectorAll('button, a, .contact-link, .modal-exit-button, .toggle-buttons');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursor?.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor?.classList.remove('hover'));
  });

  window.addEventListener('mousedown', () => cursor?.classList.add('click'));
  window.addEventListener('mouseup', () => cursor?.classList.remove('click'));
});

/**  -------------------------- Audio setup -------------------------- */

// Background Music
let pianoDebounceTimer = null;
let isMusicFaded = false;
const MUSIC_FADE_TIME = 500;
const PIANO_TIMEOUT = 2000;
const BACKGROUND_MUSIC_VOLUME = 1;
const FADED_VOLUME = 0;

const backgroundMusic = new Howl({
  src: ["/audio/music/cosmic_candy.ogg"],
  loop: true,
  volume: 1,
});

const fadeOutBackgroundMusic = () => {
  if (!isMuted && !isMusicFaded) {
    backgroundMusic.fade(
      backgroundMusic.volume(),
      FADED_VOLUME,
      MUSIC_FADE_TIME
    );
    isMusicFaded = true;
  }
};

const fadeInBackgroundMusic = () => {
  if (!isMuted && isMusicFaded) {
    backgroundMusic.fade(
      FADED_VOLUME,
      BACKGROUND_MUSIC_VOLUME,
      MUSIC_FADE_TIME
    );
    isMusicFaded = false;
  }
};

// Piano
const pianoKeyMap = {
  C1_Key: "Key_24",
  "C#1_Key": "Key_23",
  D1_Key: "Key_22",
  "D#1_Key": "Key_21",
  E1_Key: "Key_20",
  F1_Key: "Key_19",
  "F#1_Key": "Key_18",
  G1_Key: "Key_17",
  "G#1_Key": "Key_16",
  A1_Key: "Key_15",
  "A#1_Key": "Key_14",
  B1_Key: "Key_13",
  C2_Key: "Key_12",
  "C#2_Key": "Key_11",
  D2_Key: "Key_10",
  "D#2_Key": "Key_9",
  E2_Key: "Key_8",
  F2_Key: "Key_7",
  "F#2_Key": "Key_6",
  G2_Key: "Key_5",
  "G#2_Key": "Key_4",
  A2_Key: "Key_3",
  "A#2_Key": "Key_2",
  B2_Key: "Key_1",
};

const pianoSounds = {};

Object.values(pianoKeyMap).forEach((soundKey) => {
  pianoSounds[soundKey] = new Howl({
    src: [`/audio/sfx/piano/${soundKey}.ogg`],
    preload: true,
    volume: 0.5,
  });
});

// Button
const buttonSounds = {
  click: new Howl({
    src: ["/audio/sfx/click/bubble.ogg"],
    preload: true,
    volume: 0.5,
  }),
};

/**  -------------------------- Scene setup -------------------------- */
const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color("#FFF0F5");

const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  200
);

/** --------------------- Floating Particles --------------------- */
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 300;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 30; // Spread wide
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.06,
    color: '#f472a8',
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 45;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.update();

//Set starting camera position
if (window.innerWidth < 768) {
  camera.position.set(
    29.567116827654726,
    14.018476147584705,
    31.37040363900147
  );
  controls.target.set(
    -0.08206262548844094,
    3.3119233527087255,
    -0.7433922282864018
  );
} else {
  camera.position.set(17.49173098423395, 9.108969527553887, 17.850992894238058);
  controls.target.set(
    0.4624746759408973,
    1.9719940043010387,
    -0.8300979125494505
  );
}

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update Camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**  -------------------------- Modal Stuff -------------------------- */
const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact"),
};

const overlay = document.querySelector(".overlay");

let touchHappened = false;
overlay.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();
    const modal = document.querySelector('.modal[style*="display: block"]');
    if (modal) hideModal(modal);
  },
  { passive: false }
);

overlay.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();
    const modal = document.querySelector('.modal[style*="display: block"]');
    if (modal) hideModal(modal);
  },
  { passive: false }
);

document.querySelectorAll(".modal-exit-button").forEach((button) => {
  function handleModalExit(e) {
    e.preventDefault();
    const modal = e.target.closest(".modal");

    gsap.to(button, {
      scale: 5,
      duration: 0.5,
      ease: "back.out(2)",
      onStart: () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.5,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.set(button, {
              clearProps: "all",
            });
          },
        });
      },
    });

    buttonSounds.click.play();
    hideModal(modal);
  }

  button.addEventListener(
    "touchend",
    (e) => {
      touchHappened = true;
      handleModalExit(e);
    },
    { passive: false }
  );

  button.addEventListener(
    "click",
    (e) => {
      if (touchHappened) return;
      handleModalExit(e);
    },
    { passive: false }
  );
});

let isModalOpen = true;

const showModal = (modal) => {
  modal.style.display = "block";
  overlay.style.display = "block";

  isModalOpen = true;
  controls.enabled = false;

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }
  document.body.style.cursor = "default";
  currentIntersects = [];

  gsap.set(modal, {
    opacity: 0,
    scale: 0,
  });
  gsap.set(overlay, {
    opacity: 0,
  });

  gsap.to(overlay, {
    opacity: 1,
    duration: 0.5,
  });

  gsap.to(modal, {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    ease: "back.out(2)",
  });
};

const hideModal = (modal) => {
  isModalOpen = false;
  controls.enabled = true;

  gsap.to(overlay, {
    opacity: 0,
    duration: 0.5,
  });

  gsap.to(modal, {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    ease: "back.in(2)",
    onComplete: () => {
      modal.style.display = "none";
      overlay.style.display = "none";
    },
  });
};

/**  -------------------------- Loading Screen & Intro Animation -------------------------- */

const manager = new THREE.LoadingManager();

const loadingScreen = document.querySelector(".loading-screen");
const loadingScreenButton = document.querySelector(".loading-screen-button");
const noSoundButton = document.querySelector(".no-sound-button");

manager.onLoad = function () {
  loadingScreenButton.style.border = "4px solid #f472a8";
  loadingScreenButton.style.background = "linear-gradient(135deg, #f472a8, #d6c0e8)";
  loadingScreenButton.style.color = "#fff";
  loadingScreenButton.style.boxShadow = "0 8px 32px rgba(244, 114, 168, 0.35)";
  loadingScreenButton.textContent = "Enter My World!";
  loadingScreenButton.style.cursor = "pointer";
  loadingScreenButton.style.transition =
    "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
  let isDisabled = false;

  noSoundButton.textContent = "Enter without Sound 🔇";

  function handleEnter(withSound = true) {
    if (isDisabled) return;

    noSoundButton.textContent = "";
    loadingScreenButton.style.cursor = "default";
    loadingScreenButton.style.border = "4px solid #f472a8";
    loadingScreenButton.style.background = "linear-gradient(135deg, #fff0f5, #fbb6d0)";
    loadingScreenButton.style.color = "#e74d8b";
    loadingScreenButton.style.boxShadow = "none";
    loadingScreenButton.textContent = "~ Namaste!";
    loadingScreen.style.background = "linear-gradient(135deg, #fff5f8, #fbb6d0)";
    isDisabled = true;

    toggleFavicons();

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f472a8', '#b8e0d2', '#d6c0e8', '#fff0f5']
    });

    if (!withSound) {
      isMuted = true;
      updateMuteState(true);

      soundOnSvg.style.display = "none";
      soundOffSvg.style.display = "block";
    } else {
      backgroundMusic.play();
    }

    playReveal();
  }

  loadingScreenButton.addEventListener("mouseenter", () => {
    loadingScreenButton.style.transform = "scale(1.3)";
  });

  loadingScreenButton.addEventListener("touchend", (e) => {
    touchHappened = true;
    e.preventDefault();
    handleEnter();
  });

  loadingScreenButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter(true);
  });

  loadingScreenButton.addEventListener("mouseleave", () => {
    loadingScreenButton.style.transform = "none";
  });

  noSoundButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter(false);
  });
};

function playReveal() {
  const tl = gsap.timeline();

  tl.to(loadingScreen, {
    scale: 0.5,
    duration: 1.2,
    delay: 0.25,
    ease: "back.in(1.8)",
  }).to(
    loadingScreen,
    {
      y: "200vh",
      transform: "perspective(1000px) rotateX(45deg) rotateY(-35deg)",
      duration: 1.2,
      ease: "back.in(1.8)",
      onComplete: () => {
        isModalOpen = false;
        playIntroAnimation();
        loadingScreen.remove();
      },
    },
    "-=0.1"
  );
}

function playIntroAnimation() {
  
  // Set all animated objects to scale 0 first (for intro animation)
  if (plank1) plank1.scale.set(0, 0, 1);
  if (plank2) plank2.scale.set(0, 0, 0);
  if (workBtn) workBtn.scale.set(0, 0, 0);
  if (aboutBtn) aboutBtn.scale.set(0, 0, 0);
  if (contactBtn) contactBtn.scale.set(0, 0, 0);
  if (boba) boba.scale.set(0, 0, 0);
  if (github) github.scale.set(0, 0, 0);
  if (youtube) youtube.scale.set(0, 0, 0);
  if (twitter) twitter.scale.set(0, 0, 0);
  if (nameText) nameText.scale.set(0, 0, 0);
  if (flower1) flower1.scale.set(0, 0, 0);
  if (flower2) flower2.scale.set(0, 0, 0);
  if (flower3) flower3.scale.set(0, 0, 0);
  if (flower4) flower4.scale.set(0, 0, 0);
  if (flower5) flower5.scale.set(0, 0, 0);
  if (box1) box1.scale.set(0, 0, 0);
  if (box2) box2.scale.set(0, 0, 0);
  if (box3) box3.scale.set(0, 0, 0);
  if (lamp) lamp.scale.set(0, 0, 0);
  if (slippers1) slippers1.scale.set(0, 0, 0);
  if (slippers2) slippers2.scale.set(0, 0, 0);
  if (egg1) egg1.scale.set(0, 0, 0);
  if (egg2) egg2.scale.set(0, 0, 0);
  if (egg3) egg3.scale.set(0, 0, 0);
  if (frame1) frame1.scale.set(0, 0, 0);
  if (frame2) frame2.scale.set(0, 0, 0);
  if (frame3) frame3.scale.set(0, 0, 0);
  
  // Set piano keys to scale 0
  Object.values(pianoKeysMap).forEach(key => {
    if (key) key.scale.set(0, 0, 0);
  });
  
  const t1 = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  t1.timeScale(0.8);

  if (plank1) t1.to(plank1.scale, { x: plank1.userData.initialScale.x, y: plank1.userData.initialScale.y });
  if (plank2) t1.to(plank2.scale, { x: plank2.userData.initialScale.x, y: plank2.userData.initialScale.y, z: plank2.userData.initialScale.z }, "-=0.5");
  if (workBtn) t1.to(workBtn.scale, { x: workBtn.userData.initialScale.x, y: workBtn.userData.initialScale.y, z: workBtn.userData.initialScale.z }, "-=0.6");
  if (aboutBtn) t1.to(aboutBtn.scale, { x: aboutBtn.userData.initialScale.x, y: aboutBtn.userData.initialScale.y, z: aboutBtn.userData.initialScale.z }, "-=0.6");
  if (contactBtn) t1.to(contactBtn.scale, { x: contactBtn.userData.initialScale.x, y: contactBtn.userData.initialScale.y, z: contactBtn.userData.initialScale.z }, "-=0.6");

  const tFrames = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFrames.timeScale(0.8);

  if (frame1) tFrames.to(frame1.scale, { x: frame1.userData.initialScale.x, y: frame1.userData.initialScale.y, z: frame1.userData.initialScale.z });
  if (frame2) tFrames.to(frame2.scale, { x: frame2.userData.initialScale.x, y: frame2.userData.initialScale.y, z: frame2.userData.initialScale.z }, "-=0.5");
  if (frame3) tFrames.to(frame3.scale, { x: frame3.userData.initialScale.x, y: frame3.userData.initialScale.y, z: frame3.userData.initialScale.z }, "-=0.5");

  const t2 = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  t2.timeScale(0.8);

  if (boba) t2.to(boba.scale, { z: boba.userData.initialScale.z, y: boba.userData.initialScale.y, x: boba.userData.initialScale.x, delay: 0.4 });
  if (github) t2.to(github.scale, { x: github.userData.initialScale.x, y: github.userData.initialScale.y, z: github.userData.initialScale.z }, "-=0.5");
  if (youtube) t2.to(youtube.scale, { x: youtube.userData.initialScale.x, y: youtube.userData.initialScale.y, z: youtube.userData.initialScale.z }, "-=0.6");
  if (twitter) t2.to(twitter.scale, { x: twitter.userData.initialScale.x, y: twitter.userData.initialScale.y, z: twitter.userData.initialScale.z }, "-=0.6");

  const tFlowers = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFlowers.timeScale(0.8);

  if (flower5) tFlowers.to(flower5.scale, { x: flower5.userData.initialScale.x, y: flower5.userData.initialScale.y, z: flower5.userData.initialScale.z });
  if (flower4) tFlowers.to(flower4.scale, { x: flower4.userData.initialScale.x, y: flower4.userData.initialScale.y, z: flower4.userData.initialScale.z }, "-=0.5");
  if (flower3) tFlowers.to(flower3.scale, { x: flower3.userData.initialScale.x, y: flower3.userData.initialScale.y, z: flower3.userData.initialScale.z }, "-=0.5");
  if (flower2) tFlowers.to(flower2.scale, { x: flower2.userData.initialScale.x, y: flower2.userData.initialScale.y, z: flower2.userData.initialScale.z }, "-=0.5");
  if (flower1) tFlowers.to(flower1.scale, { x: flower1.userData.initialScale.x, y: flower1.userData.initialScale.y, z: flower1.userData.initialScale.z }, "-=0.5");

  const tBoxes = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tBoxes.timeScale(0.8);

  if (box1) tBoxes.to(box1.scale, { x: box1.userData.initialScale.x, y: box1.userData.initialScale.y, z: box1.userData.initialScale.z });
  if (box2) tBoxes.to(box2.scale, { x: box2.userData.initialScale.x, y: box2.userData.initialScale.y, z: box2.userData.initialScale.z }, "-=0.5");
  if (box3) tBoxes.to(box3.scale, { x: box3.userData.initialScale.x, y: box3.userData.initialScale.y, z: box3.userData.initialScale.z }, "-=0.5");

  const tLamp = gsap.timeline({
    defaults: {
      duration: 0.8,
      delay: 0.2,
      ease: "back.out(1.8)",
    },
  });
  tLamp.timeScale(0.8);

  if (lamp) tLamp.to(lamp.scale, { x: lamp.userData.initialScale.x, y: lamp.userData.initialScale.y, z: lamp.userData.initialScale.z });

  const tSlippers = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tSlippers.timeScale(0.8);

  if (slippers1) tSlippers.to(slippers1.scale, { x: slippers1.userData.initialScale.x, y: slippers1.userData.initialScale.y, z: slippers1.userData.initialScale.z, delay: 0.5 });
  if (slippers2) tSlippers.to(slippers2.scale, { x: slippers2.userData.initialScale.x, y: slippers2.userData.initialScale.y, z: slippers2.userData.initialScale.z }, "-=0.5");

  const tEggs = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tEggs.timeScale(0.8);

  if (egg1) tEggs.to(egg1.scale, { x: egg1.userData.initialScale.x, y: egg1.userData.initialScale.y, z: egg1.userData.initialScale.z });
  if (egg2) tEggs.to(egg2.scale, { x: egg2.userData.initialScale.x, y: egg2.userData.initialScale.y, z: egg2.userData.initialScale.z }, "-=0.5");
  if (egg3) tEggs.to(egg3.scale, { x: egg3.userData.initialScale.x, y: egg3.userData.initialScale.y, z: egg3.userData.initialScale.z }, "-=0.5");

  const tFish = gsap.timeline({
    defaults: {
      delay: 0.8,
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFish.timeScale(0.8);

  if (fish) tFish.to(fish.scale, { x: fish.userData.initialScale.x, y: fish.userData.initialScale.y, z: fish.userData.initialScale.z });

  if (nameText) {
    const textTl = gsap.timeline({
      defaults: {
        duration: 0.8,
        ease: "back.out(1.7)",
      },
    });

    textTl
      .to(nameText.position, {
        y: nameText.userData.initialPosition.y + 0.3,
        duration: 0.4,
      })
      .to(nameText.scale, {
        x: nameText.userData.initialScale.x,
        y: nameText.userData.initialScale.y,
        z: nameText.userData.initialScale.z,
        duration: 0.4,
      }, "<")
      .to(nameText.position, {
        y: nameText.userData.initialPosition.y,
        duration: 0.4,
      });
  }

  const pianoKeysTl = gsap.timeline({
    defaults: {
      duration: 0.4,
      ease: "back.out(1.7)",
      onComplete: () => {
        setTimeout(() => {
          createDelayedHitboxes();
        }, 1950);
      },
    },
  });
  pianoKeysTl.timeScale(1.2);

  const pianoKeys = Object.values(pianoKeysMap);

  pianoKeys.forEach((key, index) => {
    if (!key || !key.userData?.initialPosition) return;

    pianoKeysTl
      .to(
        key.position,
        {
          y: key.userData.initialPosition.y + 0.2,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        index * 0.1
      )
      .to(
        key.scale,
        {
          x: key.userData.initialScale.x,
          y: key.userData.initialScale.y,
          z: key.userData.initialScale.z,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        "<"
      )
      .to(
        key.position,
        {
          y: key.userData.initialPosition.y,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        ">-0.2"
      );
  });
}

/**  -------------------------- Loaders & Texture Preparations -------------------------- */
const textureLoader = new THREE.TextureLoader();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const loader = new GLTFLoader(manager);
loader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
  .setPath("textures/skybox/")
  .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);

const textureMap = {
  First: {
    day: "/textures/room/day/first_texture_set_day.webp",
    night: "/textures/room/night/first_texture_set_night.webp",
  },
  Second: {
    day: "/textures/room/day/second_texture_set_day.webp",
    night: "/textures/room/night/second_texture_set_night.webp",
  },
  Third: {
    day: "/textures/room/day/third_texture_set_day.webp",
    night: "/textures/room/night/third_texture_set_night.webp",
  },
  Fourth: {
    day: "/textures/room/day/fourth_texture_set_day.webp",
    night: "/textures/room/night/fourth_texture_set_night.webp",
  },
};

const loadedTextures = {
  day: {},
  night: {},
};

Object.entries(textureMap).forEach(([key, paths]) => {
  // Load and configure day texture
  const dayTexture = textureLoader.load(paths.day);
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  dayTexture.minFilter = THREE.LinearFilter;
  dayTexture.magFilter = THREE.LinearFilter;
  loadedTextures.day[key] = dayTexture;

  // Load and configure night texture
  const nightTexture = textureLoader.load(paths.night);
  nightTexture.flipY = false;
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  nightTexture.minFilter = THREE.LinearFilter;
  nightTexture.magFilter = THREE.LinearFilter;
  loadedTextures.night[key] = nightTexture;
});

// Reuseable Materials
const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  opacity: 1,
  color: 0xfbfbfb,
  metalness: 0,
  roughness: 0,
  ior: 3,
  thickness: 0.01,
  specularIntensity: 1,
  envMap: environmentMap,
  envMapIntensity: 1,
  depthWrite: false,
  specularColor: 0xfbfbfb,
});

const whiteMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

const createMaterialForTextureSet = (textureSet) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uDayTexture1: { value: loadedTextures.day.First },
      uNightTexture1: { value: loadedTextures.night.First },
      uDayTexture2: { value: loadedTextures.day.Second },
      uNightTexture2: { value: loadedTextures.night.Second },
      uDayTexture3: { value: loadedTextures.day.Third },
      uNightTexture3: { value: loadedTextures.night.Third },
      uDayTexture4: { value: loadedTextures.day.Fourth },
      uNightTexture4: { value: loadedTextures.night.Fourth },
      uMixRatio: { value: 0 },
      uTextureSet: { value: textureSet },
    },
    vertexShader: themeVertexShader,
    fragmentShader: themeFragmentShader,
  });

  Object.entries(material.uniforms).forEach(([key, uniform]) => {
    if (uniform.value instanceof THREE.Texture) {
      uniform.value.minFilter = THREE.LinearFilter;
      uniform.value.magFilter = THREE.LinearFilter;
    }
  });

  return material;
};

const roomMaterials = {
  First: createMaterialForTextureSet(1),
  Second: createMaterialForTextureSet(2),
  Third: createMaterialForTextureSet(3),
  Fourth: createMaterialForTextureSet(4),
};

// Smoke Shader setup
const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
smokeGeometry.translate(0, 0.5, 0);
smokeGeometry.scale(0.33, 1, 0.33);

const perlinTexture = textureLoader.load("/shaders/perlin.png");
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;

const smokeMaterial = new THREE.ShaderMaterial({
  vertexShader: smokeVertexShader,
  fragmentShader: smokeFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uPerlinTexture: new THREE.Uniform(perlinTexture),
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
});

const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
smoke.position.y = 1.83;
scene.add(smoke);

const videoElement = document.createElement("video");
videoElement.src = "/textures/video/Screen.mp4";
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.autoplay = true;
videoElement.play();

const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.flipY = false;

/**  -------------------------- Model and Mesh Setup -------------------------- */

// LOL DO NOT DO THIS USE A FUNCTION TO AUTOMATE THIS PROCESS HAHAHAAHAHAHAHAHAHA
let fish;
let coffeePosition;
let hourHand;
let minuteHand;
let chairTop;
const xAxisFans = [];
const yAxisFans = [];
let plank1,
  plank2,
  workBtn,
  aboutBtn,
  contactBtn,
  boba,
  github,
  youtube,
  twitter;

let nameText;

const pianoKeysMap = {};

let flower1, flower2, flower3, flower4, flower5;

let box1, box2, box3;

let lamp;

let slippers1, slippers2;

let egg1, egg2, egg3;

let frame1, frame2, frame3;

const useOriginalMeshObjects = ["Bulb", "Cactus", "Kirby"];

const objectsNeedingHitboxes = [];

const objectsWithIntroAnimations = [
  "Hanging_Plank_1",
  "Hanging_Plank_2",
  "My_Work_Button",
  "About_Button",
  "Contact_Button",
  "Boba",
  "GitHub",
  "YouTube",
  "Twitter",
  "Name_Letter_1",
  "Name_Letter_2",
  "Name_Letter_3",
  "Name_Letter_4",
  "Name_Letter_5",
  "Name_Letter_6",
  "Name_Letter_7",
  "Name_Letter_8",
  "Flower_1",
  "Flower_2",
  "Flower_3",
  "Flower_4",
  "Flower_5",
  "Box_1",
  "Box_2",
  "Box_3",
  "Lamp",
  "Slipper_1",
  "Slipper_2",
  "Fish_Fourth",
  "Egg_1",
  "Egg_2",
  "Egg_3",
  "Frame_1",
  "Frame_2",
  "Frame_3",
  "C1_Key",
  "C#1_Key",
  "D1_Key",
  "D#1_Key",
  "E1_Key",
  "F1_Key",
  "F#1_Key",
  "G1_Key",
  "G#1_Key",
  "A1_Key",
  "A#1_Key",
  "B1_Key",
  "C2_Key",
  "C#2_Key",
  "D2_Key",
  "D#2_Key",
  "E2_Key",
  "F2_Key",
  "F#2_Key",
  "G2_Key",
  "G#2_Key",
  "A2_Key",
  "A#2_Key",
  "B2_Key",
];

function hasIntroAnimation(objectName) {
  return objectsWithIntroAnimations.some((animatedName) =>
    objectName.includes(animatedName)
  );
}

loader.load(
  "/models/Room_Portfolio.glb",
  (glb) => {
    glb.scene.traverse((child) => {
    if (child.isMesh) {
      if (child.name.includes("Fish_Fourth")) {
        fish = child;
        child.position.x += 0.04;
        child.position.z -= 0.03;
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
      }
      if (child.name.includes("Chair_Top")) {
        chairTop = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Hour_Hand")) {
        hourHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Minute_Hand")) {
        minuteHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Coffee")) {
        coffeePosition = child.position.clone();
      }

      if (child.name.includes("Hover") || child.name.includes("Key")) {
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      // LOL DO NOT DO THIS USE A FUNCTION TO AUTOMATE THIS PROCESS HAHAHAAHAHAHAHAHAHA
      if (child.name.includes("Hanging_Plank_1")) {
        plank1 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Hanging_Plank_2")) {
        plank2 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("My_Work_Button")) {
        workBtn = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("About_Button")) {
        aboutBtn = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Contact_Button")) {
        contactBtn = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Boba")) {
        boba = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("GitHub")) {
        github = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("YouTube")) {
        youtube = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Twitter")) {
        twitter = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Text")) {
        nameText = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Flower_1")) {
        flower1 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Flower_2")) {
        flower2 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Flower_3")) {
        flower3 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Flower_4")) {
        flower4 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Flower_5")) {
        flower5 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Box_1")) {
        box1 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Box_2")) {
        box2 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Box_3")) {
        box3 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Lamp")) {
        lamp = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Slipper_1")) {
        slippers1 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Slipper_2")) {
        slippers2 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Fish_Fourth")) {
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Egg_1")) {
        egg1 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Egg_2")) {
        egg2 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Egg_3")) {
        egg3 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Frame_1")) {
        frame1 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Frame_2")) {
        frame2 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      } else if (child.name.includes("Frame_3")) {
        frame3 = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      }
      // Capture ANY mesh with "Key" in name from Blender
      if (child.name.includes("Key")) {
        pianoKeysMap[child.name] = child;
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
      }

      if (child.name.includes("Water")) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x558bc8,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        });
      } else if (child.name.includes("Glass")) {
        child.material = glassMaterial;
      } else if (child.name.includes("Bubble")) {
        child.material = whiteMaterial;
      } else if (child.name.includes("Screen")) {
        child.material = new THREE.MeshBasicMaterial({
          map: videoTexture,
          transparent: true,
          opacity: 0.9,
        });
      } else {
        Object.keys(textureMap).forEach((key) => {
          if (child.name.includes(key)) {
            child.material = roomMaterials[key];

            if (child.name.includes("Fan")) {
              if (
                child.name.includes("Fan_2") ||
                child.name.includes("Fan_4")
              ) {
                xAxisFans.push(child);
              } else {
                yAxisFans.push(child);
              }
            }
          }
        });
      }

      if (child.name.includes("Raycaster")) {
        if (hasIntroAnimation(child.name)) {
          // Create a hitbox for object after intro is done playing,
          // Set an original scale first for the hitbox
          child.userData.originalScale = new THREE.Vector3(1, 1, 1);

          objectsNeedingHitboxes.push(child);
        } else {
          // Create immediate hitboxes/meshes for objects that DON'T have an intro animation
          const raycastObject = createStaticHitbox(child);

          if (raycastObject !== child) {
            scene.add(raycastObject);
          }

          raycasterObjects.push(raycastObject);
          hitboxToObjectMap.set(raycastObject, child);
        }
      }
    }
  });

  if (coffeePosition) {
    smoke.position.set(
      coffeePosition.x,
      coffeePosition.y + 0.2,
      coffeePosition.z
    );
  }

  scene.add(glb.scene);
});

/**  -------------------------- Raycaster setup -------------------------- */

const raycasterObjects = [];
let currentIntersects = [];
let currentHoveredObject = null;

const socialLinks = {
  GitHub: "https://github.com/Sweta-82",
  YouTube: "https://www.youtube.com/",
  Twitter: "https://www.twitter.com/",
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const hitboxToObjectMap = new Map();

function shouldUseOriginalMesh(objectName) {
  return useOriginalMeshObjects.some((meshName) =>
    objectName.includes(meshName)
  );
}

function createStaticHitbox(originalObject) {
  // Check if we should use original mesh
  if (shouldUseOriginalMesh(originalObject.name)) {
    if (!originalObject.userData.initialScale) {
      originalObject.userData.initialScale = new THREE.Vector3().copy(
        originalObject.scale
      );
    }
    if (!originalObject.userData.initialPosition) {
      originalObject.userData.initialPosition = new THREE.Vector3().copy(
        originalObject.position
      );
    }
    if (!originalObject.userData.initialRotation) {
      originalObject.userData.initialRotation = new THREE.Euler().copy(
        originalObject.rotation
      );
    }

    originalObject.userData.originalObject = originalObject;
    return originalObject;
  }

  if (!originalObject.userData.initialScale) {
    originalObject.userData.initialScale = new THREE.Vector3().copy(
      originalObject.scale
    );
  }
  if (!originalObject.userData.initialPosition) {
    originalObject.userData.initialPosition = new THREE.Vector3().copy(
      originalObject.position
    );
  }
  if (!originalObject.userData.initialRotation) {
    originalObject.userData.initialRotation = new THREE.Euler().copy(
      originalObject.rotation
    );
  }

  const currentScale = originalObject.scale.clone();
  const hasZeroScale =
    currentScale.x === 0 || currentScale.y === 0 || currentScale.z === 0;

  if (hasZeroScale && originalObject.userData.originalScale) {
    originalObject.scale.copy(originalObject.userData.originalScale);
  }

  const box = new THREE.Box3().setFromObject(originalObject);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  if (hasZeroScale) {
    originalObject.scale.copy(currentScale);
  }

  let hitboxGeometry;
  let sizeMultiplier = { x: 1.1, y: 1.75, z: 1.1 };

  hitboxGeometry = new THREE.BoxGeometry(
    size.x * sizeMultiplier.x,
    size.y * sizeMultiplier.y,
    size.z * sizeMultiplier.z
  );

  const hitboxMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    visible: false,
  });

  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
  hitbox.position.copy(center);
  hitbox.name = originalObject.name + "_Hitbox";
  hitbox.userData.originalObject = originalObject;

  if (originalObject.name.includes("Headphones")) {
    hitbox.rotation.x = 0;
    hitbox.rotation.y = Math.PI / 4;
    hitbox.rotation.z = 0;
  }

  return hitbox;
}

function createDelayedHitboxes() {
  objectsNeedingHitboxes.forEach((child) => {
    const raycastObject = createStaticHitbox(child);

    if (raycastObject !== child) {
      scene.add(raycastObject);
    }

    raycasterObjects.push(raycastObject);
    hitboxToObjectMap.set(raycastObject, child);
  });

  objectsNeedingHitboxes.length = 0;
}

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const hitbox = currentIntersects[0].object;
    const object = hitboxToObjectMap.get(hitbox);

    if (object.name.includes("Button")) {
      buttonSounds.click.play();
    }

    Object.entries(pianoKeyMap).forEach(([keyName, soundKey]) => {
      if (object.name.includes(keyName)) {
        if (pianoDebounceTimer) {
          clearTimeout(pianoDebounceTimer);
        }

        fadeOutBackgroundMusic();

        pianoSounds[soundKey].play();

        pianoDebounceTimer = setTimeout(() => {
          fadeInBackgroundMusic();
        }, PIANO_TIMEOUT);

        gsap.to(object.rotation, {
          x: object.userData.initialRotation.x + Math.PI / 42,
          duration: 0.4,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.to(object.rotation, {
              x: object.userData.initialRotation.x,
              duration: 0.25,
              ease: "back.out(2)",
            });
          },
        });
      }
    });

    Object.entries(socialLinks).forEach(([key, url]) => {
      if (object.name.includes(key)) {
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = url;
        newWindow.target = "_blank";
        newWindow.rel = "noopener noreferrer";
      }
    });

    if (object.name.includes("Work_Button")) {
      showModal(modals.work);
    } else if (object.name.includes("About_Button")) {
      showModal(modals.about);
    } else if (object.name.includes("Contact_Button")) {
      showModal(modals.contact);
    } else if (object.name.includes("Kirby")) {
      // Phase 2: Interactive Kirby!
      buttonSounds.click.play();
      gsap.to(object.rotation, {
        y: object.userData.initialRotation.y + Math.PI * 2,
        duration: 0.8,
        ease: "back.out(1.5)",
        onComplete: () => {
          gsap.set(object.rotation, { y: object.userData.initialRotation.y }); 
        }
      });
      gsap.to(object.scale, {
        x: object.userData.initialScale.x * 1.5,
        y: object.userData.initialScale.y * 1.5,
        z: object.userData.initialScale.z * 1.5,
        duration: 0.3,
        yoyo: true,
        repeat: 1
      });
    }
  }
}

function playHoverAnimation(objectHitbox, isHovering) {
  let scale = 1.4;
  const object = hitboxToObjectMap.get(objectHitbox);
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (object.name.includes("Coffee")) {
    gsap.killTweensOf(smoke.scale);
    if (isHovering) {
      gsap.to(smoke.scale, {
        x: 1.4,
        y: 1.4,
        z: 1.4,
        duration: 0.5,
        ease: "back.out(2)",
      });
    } else {
      gsap.to(smoke.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  }

  if (object.name.includes("Fish")) {
    scale = 1.2;
  }

  if (isHovering) {
    // Scale animation for all objects
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * scale,
      y: object.userData.initialScale.y * scale,
      z: object.userData.initialScale.z * scale,
      duration: 0.5,
      ease: "back.out(2)",
    });

    if (object.name.includes("About_Button")) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x - Math.PI / 10,
        duration: 0.5,
        ease: "back.out(2)",
      });
    } else if (
      object.name.includes("Contact_Button") ||
      object.name.includes("My_Work_Button") ||
      object.name.includes("GitHub") ||
      object.name.includes("YouTube") ||
      object.name.includes("Twitter")
    ) {
      let isSocial = object.name.includes("GitHub") || object.name.includes("YouTube") || object.name.includes("Twitter");
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x + Math.PI / 10,
        y: isSocial ? object.userData.initialRotation.y + Math.PI * 2 : object.userData.initialRotation.y,
        duration: isSocial ? 0.8 : 0.5,
        ease: "back.out(2)",
      });
    }

    if (object.name.includes("Boba") || object.name.includes("Name_Letter")) {
      gsap.to(object.position, {
        y: object.userData.initialPosition.y + 0.2,
        duration: 0.5,
        ease: "back.out(2)",
      });
    }
  } else {
    // Reset scale for all objects
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "back.out(2)",
    });

    if (
      object.name.includes("About_Button") ||
      object.name.includes("Contact_Button") ||
      object.name.includes("My_Work_Button") ||
      object.name.includes("GitHub") ||
      object.name.includes("YouTube") ||
      object.name.includes("Twitter")
    ) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x,
        y: object.userData.initialRotation.y,
        duration: 0.4,
        ease: "back.out(2)",
      });
    }

    if (object.name.includes("Boba") || object.name.includes("Name_Letter")) {
      gsap.to(object.position, {
        y: object.userData.initialPosition.y,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  }
}

window.addEventListener("mousemove", (e) => {
  touchHappened = false;
  pointer.x = (e.clientX / sizes.width) * 2 - 1;
  pointer.y = -(e.clientY / sizes.height) * 2 + 1;
});

window.addEventListener(
  "touchstart",
  (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / sizes.width) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / sizes.height) * 2 + 1;
  },
  { passive: false }
);

window.addEventListener(
  "touchend",
  (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    handleRaycasterInteraction();
  },
  { passive: false }
);

window.addEventListener("click", handleRaycasterInteraction);

// Other Event Listeners
const themeToggleButton = document.querySelector(".theme-toggle-button");
const muteToggleButton = document.querySelector(".mute-toggle-button");
const sunSvg = document.querySelector(".sun-svg");
const moonSvg = document.querySelector(".moon-svg");
const soundOffSvg = document.querySelector(".sound-off-svg");
const soundOnSvg = document.querySelector(".sound-on-svg");

const updateMuteState = (muted) => {
  if (muted) {
    backgroundMusic.volume(0);
  } else {
    backgroundMusic.volume(BACKGROUND_MUSIC_VOLUME);
  }

  buttonSounds.click.mute(muted);
  Object.values(pianoSounds).forEach((sound) => {
    sound.mute(muted);
  });
};

const handleMuteToggle = (e) => {
  e.preventDefault();

  isMuted = !isMuted;
  updateMuteState(isMuted);
  buttonSounds.click.play();

  if (!backgroundMusic.playing()) {
    backgroundMusic.play();
  }

  gsap.to(muteToggleButton, {
    rotate: -45,
    scale: 5,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (!isMuted) {
        soundOffSvg.style.display = "none";
        soundOnSvg.style.display = "block";
      } else {
        soundOnSvg.style.display = "none";
        soundOffSvg.style.display = "block";
      }

      gsap.to(muteToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.set(muteToggleButton, {
            clearProps: "all",
          });
        },
      });
    },
  });
};

let isMuted = false;
muteToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleMuteToggle(e);
  },
  { passive: false }
);

muteToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleMuteToggle(e);
  },
  { passive: false }
);

// Themeing stuff
const toggleFavicons = () => {
  const isDark = document.body.classList.contains("dark-theme");
  const theme = isDark ? "light" : "dark";

  document.querySelector(
    'link[sizes="96x96"]'
  ).href = `media/${theme}-favicon/favicon-96x96.png`;
  document.querySelector(
    'link[type="image/svg+xml"]'
  ).href = `/media/${theme}-favicon/favicon.svg`;
  document.querySelector(
    'link[rel="shortcut icon"]'
  ).href = `media/${theme}-favicon/favicon.ico`;
  document.querySelector(
    'link[rel="apple-touch-icon"]'
  ).href = `media/${theme}-favicon/apple-touch-icon.png`;
  document.querySelector(
    'link[rel="manifest"]'
  ).href = `media/${theme}-favicon/site.webmanifest`;
};

let isNightMode = false;

const handleThemeToggle = (e) => {
  e.preventDefault();
  toggleFavicons();

  const isDark = document.body.classList.contains("dark-theme");
  document.body.classList.remove(isDark ? "dark-theme" : "light-theme");
  document.body.classList.add(isDark ? "light-theme" : "dark-theme");

  isNightMode = !isNightMode;
  buttonSounds.click.play();

  gsap.to(themeToggleButton, {
    rotate: 45,
    scale: 5,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (isNightMode) {
        sunSvg.style.display = "none";
        moonSvg.style.display = "block";
      } else {
        moonSvg.style.display = "none";
        sunSvg.style.display = "block";
      }

      gsap.to(themeToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.set(themeToggleButton, {
            clearProps: "all",
          });
        },
      });
    },
  });

  Object.values(roomMaterials).forEach((material) => {
    gsap.to(material.uniforms.uMixRatio, {
      value: isNightMode ? 1 : 0,
      duration: 1.5,
      ease: "power2.inOut",
    });
  });

  const targetColor = isNightMode ? new THREE.Color("#1A1B2E") : new THREE.Color("#FFF0F5");
  gsap.to(scene.background, {
    r: targetColor.r,
    g: targetColor.g,
    b: targetColor.b,
    duration: 1.5,
    ease: "power2.inOut",
  });
};

// Click event listener
themeToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleThemeToggle(e);
  },
  { passive: false }
);

themeToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleThemeToggle(e);
  },
  { passive: false }
);

/**  -------------------------- Render and Animations Stuff -------------------------- */
const clock = new THREE.Clock();

const updateClockHands = () => {
  if (!hourHand || !minuteHand) return;

  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const minuteAngle = (minutes + seconds / 60) * ((Math.PI * 2) / 60);

  const hourAngle = (hours + minutes / 60) * ((Math.PI * 2) / 12);

  minuteHand.rotation.x = -minuteAngle;
  hourHand.rotation.x = -hourAngle;
};

const render = (timestamp) => {
  const elapsedTime = clock.getElapsedTime();

  // Update Shader Univform
  smokeMaterial.uniforms.uTime.value = elapsedTime;

  //Update Orbit Controls
  controls.update();

  // Update Clock hand rotation
  updateClockHands();

  // Fan rotate animation
  xAxisFans.forEach((fan) => {
    fan.rotation.x -= 0.04;
  });

  yAxisFans.forEach((fan) => {
    fan.rotation.y -= 0.04;
  });

  // Animate Particles
  if (particlesMesh) {
    particlesMesh.rotation.y = timestamp * 0.00005;
    particlesMesh.rotation.x = timestamp * 0.00002;
  }

  // Chair rotate animation
  if (chairTop) {
    const time = timestamp * 0.001;
    const baseAmplitude = Math.PI / 8;

    const rotationOffset =
      baseAmplitude *
      Math.sin(time * 0.5) *
      (1 - Math.abs(Math.sin(time * 0.5)) * 0.3);

    chairTop.rotation.y = chairTop.userData.initialRotation.y + rotationOffset;
  }

  // Fish up and down animation
  if (fish) {
    const time = timestamp * 0.0015;
    const amplitude = 0.12;
    const position =
      amplitude * Math.sin(time) * (1 - Math.abs(Math.sin(time)) * 0.1);
    fish.position.y = fish.userData.initialPosition.y + position;
  }

  // Raycaster
  if (!isModalOpen) {
    raycaster.setFromCamera(pointer, camera);

    // Get all the objects the raycaster is currently shooting through / intersecting with
    currentIntersects = raycaster.intersectObjects(raycasterObjects);

    for (let i = 0; i < currentIntersects.length; i++) {}

    if (currentIntersects.length > 0) {
      const currentIntersectObject = currentIntersects[0].object;

      if (currentIntersectObject.name.includes("Hover")) {
        if (currentIntersectObject !== currentHoveredObject) {
          if (currentHoveredObject) {
            playHoverAnimation(currentHoveredObject, false);
          }

          currentHoveredObject = currentIntersectObject;
          playHoverAnimation(currentIntersectObject, true);
        }
      }

      if (currentIntersectObject.name.includes("Pointer")) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    } else {
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
    }
  }

  renderer.render(scene, camera);

  window.requestAnimationFrame(render);
};

render();
