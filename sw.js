// Offline support. The app shell is precached on install. Code is served
// network-first (so updates show up on the next open) with the cache as the
// offline fallback; photos are served cache-first. New files are cached as they
// are fetched, so FILES only needs to cover what should work offline from day one.
const VERSION = 'coach-v1';
const FILES = [
    "./",
    "index.html",
    "manifest.webmanifest",
    "css/app.css",
    "icons/apple-touch-icon.png",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "js/app.js",
    "js/body.js",
    "js/data/exercises.js",
    "js/data/program.js",
    "js/engine.js",
    "js/feedback.js",
    "js/onboarding.js",
    "js/player.js",
    "js/store.js",
    "js/ui.js",
    "media/Ankle_Circles/0.jpg",
    "media/Ankle_Circles/1.jpg",
    "media/Band_Good_Morning/0.jpg",
    "media/Band_Good_Morning/1.jpg",
    "media/Band_Pull_Apart/0.jpg",
    "media/Band_Pull_Apart/1.jpg",
    "media/Bodyweight_Squat/0.jpg",
    "media/Bodyweight_Squat/1.jpg",
    "media/Butt_Lift_Bridge/0.jpg",
    "media/Butt_Lift_Bridge/1.jpg",
    "media/Calf_Stretch_Hands_Against_Wall/0.jpg",
    "media/Calf_Stretch_Hands_Against_Wall/1.jpg",
    "media/Cat_Stretch/0.jpg",
    "media/Cat_Stretch/1.jpg",
    "media/Dead_Bug/0.jpg",
    "media/Dead_Bug/1.jpg",
    "media/Dumbbell_Rear_Lunge/0.jpg",
    "media/Dumbbell_Rear_Lunge/1.jpg",
    "media/Dumbbell_Squat_To_A_Bench/0.jpg",
    "media/Dumbbell_Squat_To_A_Bench/1.jpg",
    "media/Dumbbell_Step_Ups/0.jpg",
    "media/Dumbbell_Step_Ups/1.jpg",
    "media/Incline_Push-Up/0.jpg",
    "media/Incline_Push-Up/1.jpg",
    "media/Kneeling_Hip_Flexor/0.jpg",
    "media/Kneeling_Hip_Flexor/1.jpg",
    "media/One-Arm_Dumbbell_Row/0.jpg",
    "media/One-Arm_Dumbbell_Row/1.jpg",
    "media/Shoulder_Circles/0.jpg",
    "media/Shoulder_Circles/1.jpg",
    "media/Side_Leg_Raises/0.jpg",
    "media/Side_Leg_Raises/1.jpg",
    "media/Single_Leg_Glute_Bridge/0.jpg",
    "media/Single_Leg_Glute_Bridge/1.jpg",
    "media/Standing_Dumbbell_Calf_Raise/0.jpg",
    "media/Standing_Dumbbell_Calf_Raise/1.jpg",
    "media/Standing_Hip_Circles/0.jpg",
    "media/Standing_Hip_Circles/1.jpg",
    "media/Stiff-Legged_Dumbbell_Deadlift/0.jpg",
    "media/Stiff-Legged_Dumbbell_Deadlift/1.jpg",
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isMedia = new URL(req.url).pathname.includes('/media/');
  const put = (res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  };
  if (isMedia) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(put)));
  } else {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(put).catch(() => caches.match(req, { ignoreSearch: true })
      .then((hit) => hit || caches.match('index.html'))));
  }
});
