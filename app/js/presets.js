// Steam image targets (post-2024 Steamworks sizes). `display` is roughly the size the client or
// store shows the image at, used for the "as seen" previews. `legacy` is the pre-2024 size of
// the same shape: Steamworks no longer accepts it, but press kits and custom library art still use it.
// Groups: store (store page), library (Steam client library), custom (your own library artwork for
// any game, via the client's "set custom artwork" or the grid folder), community.
export const GROUPS = ['store', 'library', 'custom', 'community'];

// The four places the Steam client can pin a library logo over the hero.
export const HERO_LOGO_POSITIONS = ['BottomLeft', 'UpperCenter', 'CenterCenter', 'BottomCenter'];
// Centre area of the hero that stays visible at every window size (860×380 of 1920×620).
const HERO_SAFE = [(1 - 860 / 1920) / 2, (1 - 380 / 620) / 2, 860 / 1920, 380 / 620];

export const PRESETS = [
  // ---- store page ----
  { id: 'header', group: 'store', w: 920, h: 430, display: [460, 215], formats: ['jpg', 'png'], legacy: [460, 215], text: true },
  { id: 'small', group: 'store', w: 462, h: 174, display: [231, 87], formats: ['jpg', 'png'], legacy: [231, 87], text: true },
  { id: 'main', group: 'store', w: 1232, h: 706, display: [616, 353], formats: ['jpg', 'png'], legacy: [616, 353], text: true },
  { id: 'vertical', group: 'store', w: 748, h: 896, display: [374, 448], formats: ['jpg', 'png'], legacy: [374, 448], text: true },
  { id: 'background', group: 'store', w: 1920, h: 1080, display: [960, 540], formats: ['jpg', 'png'], legacy: [1438, 810] },
  { id: 'screenshot', group: 'store', w: 1920, h: 1080, display: [600, 338], formats: ['jpg', 'png'] },
  { id: 'event', group: 'store', w: 800, h: 450, display: [400, 225], formats: ['jpg', 'png'] },
  { id: 'eventheader', group: 'store', w: 1920, h: 622, display: [960, 311], formats: ['jpg', 'png'] },
  { id: 'bundle', group: 'store', w: 1438, h: 810, display: [719, 405], formats: ['jpg', 'png'], text: true },
  // ---- library ----
  { id: 'libcapsule', group: 'library', w: 600, h: 900, display: [300, 450], formats: ['jpg', 'png'], text: true },
  { id: 'libheader', group: 'library', w: 920, h: 430, display: [460, 215], formats: ['jpg', 'png'], text: true },
  { id: 'libhero', group: 'library', w: 3840, h: 1240, display: [1920, 620], formats: ['jpg', 'png'], safe: HERO_SAFE, hero: true },
  { id: 'liblogo', group: 'library', w: 1280, h: 720, display: [640, 360], formats: ['png'], mode: 'fit' },
  // ---- custom library art: file names used by the client's grid folder, {id} = Steam app ID ----
  { id: 'grid', group: 'custom', w: 600, h: 900, display: [300, 450], formats: ['png', 'jpg'], text: true, steamName: '{id}p' },
  { id: 'gridwide', group: 'custom', w: 920, h: 430, display: [460, 215], formats: ['png', 'jpg'], legacy: [460, 215], text: true, steamName: '{id}' },
  { id: 'hero', group: 'custom', w: 1920, h: 620, display: [1920, 620], formats: ['png', 'jpg'], safe: HERO_SAFE, hero: true, steamName: '{id}_hero' },
  { id: 'logo', group: 'custom', w: 1280, h: 720, display: [640, 360], formats: ['png'], mode: 'fit', steamName: '{id}_logo' },
  { id: 'icon', group: 'custom', w: 256, h: 256, display: [32, 32], formats: ['png', 'ico'], steamName: '{id}_icon' },
  // ---- community and client ----
  { id: 'communityicon', group: 'community', w: 184, h: 184, display: [64, 64], formats: ['jpg', 'png'] },
  { id: 'clienticon', group: 'community', w: 32, h: 32, display: [32, 32], formats: ['ico', 'png'] },
];

// Sizes packed into an .ico file (each entry is a PNG).
export const ICO_SIZES = [16, 24, 32, 48, 64, 256];

export const byId = (id) => PRESETS.find((p) => p.id === id);
export const inGroup = (group) => PRESETS.filter((p) => p.group === group);
