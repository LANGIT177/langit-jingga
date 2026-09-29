// ============================================================
// LANGIT JINGGA — audio.js
// Local audio player for direct file:// opening.
// Three-track story arc with crossfade between scene music.
// ============================================================

const AudioEngine = (() => {
  const tracks = {
    dulu_kita_masih_remaja: {
      src: "audio/dulu-kita-masih-remaja.mp3",
      title: "Yang Dulu Kita Masih Remaja",
      mood: "nostalgia · hangat · masa muda"
    },
    bolehkah_kuminta_hatimu: {
      src: "audio/bolehkah-kuminta-hatimu.mp3",
      title: "Bolehkah Ku Minta Hatimu",
      mood: "hangat · jatuh cinta · dekat"
    },
    dimana_kamu: {
      src: "audio/dimana-kamu.mp3",
      title: "Dimana Kamu",
      mood: "rindu · menunggu · jauh"
    }
  };

  const players = [new Audio(), new Audio()];
  players.forEach(a => {
    a.loop = true;
    a.preload = "auto";
    a.volume = 0;
  });

  let active = 0;
  let currentId = null;
  let started = false;
  let muted = false;
  let volume = 0.65;
  let fadeToken = 0;

  const titleEl = document.getElementById("trackTitle");
  const moodEl = document.getElementById("trackMood");
  const playBtn = document.getElementById("audioPlay");
  const muteBtn = document.getElementById("audioMute");
  const volumeEl = document.getElementById("volume");

  function updateUI(id) {
    const track = tracks[id];
    if (!track) {
      titleEl.textContent = "Musik berhenti";
      moodEl.textContent = "Mulai membaca untuk mengaktifkan musik";
      return;
    }
    titleEl.textContent = track.title;
    moodEl.textContent = track.mood;
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, Number(v)));
    players[active].volume = muted ? 0 : volume;
  }

  function stopOtherPlayer(nextIndex) {
    players.forEach((audio, index) => {
      if (index !== nextIndex) {
        audio.pause();
        audio.volume = 0;
      }
    });
  }

  async function start(id) {
    const trackId = tracks[id] ? id : "dulu_kita_masih_remaja";
    const track = tracks[trackId];
    const audio = players[active];

    fadeToken += 1;
    started = true;
    currentId = trackId;
    audio.pause();
    audio.src = new URL(track.src, document.baseURI).href;
    audio.currentTime = 0;
    audio.volume = muted ? 0 : volume;
    updateUI(trackId);
    stopOtherPlayer(active);

    try {
      await audio.play();
      playBtn.textContent = "Ⅱ";
    } catch (e) {
      playBtn.textContent = "▶";
      moodEl.textContent = "Klik tombol ▶ untuk memutar musik";
      console.warn("Audio tidak dapat diputar:", e);
    }
  }

  async function crossfade(id) {
    const track = tracks[id];
    if (!track || id === currentId) return;

    if (!started) {
      currentId = id;
      updateUI(id);
      return;
    }

    const token = ++fadeToken;
    const next = 1 - active;
    const nextAudio = players[next];
    const oldAudio = players[active];

    nextAudio.pause();
    nextAudio.src = new URL(track.src, document.baseURI).href;
    nextAudio.currentTime = 0;
    nextAudio.volume = 0;

    try {
      await nextAudio.play();
    } catch (e) {
      console.warn("Track tidak dapat diputar:", track.src, e);
      playBtn.textContent = "▶";
      moodEl.textContent = "File musik tidak dapat dibaca browser";
      return;
    }

    const startTime = performance.now();
    const duration = 2500;

    function fade(t) {
      if (token !== fadeToken) return;
      const p = Math.min(1, (t - startTime) / duration);
      const eased = p * p * (3 - 2 * p);
      nextAudio.volume = muted ? 0 : volume * eased;
      oldAudio.volume = muted ? 0 : volume * (1 - eased);
      if (p < 1) {
        requestAnimationFrame(fade);
      } else {
        oldAudio.pause();
        oldAudio.currentTime = 0;
        active = next;
        currentId = id;
        updateUI(id);
        playBtn.textContent = "Ⅱ";
      }
    }

    requestAnimationFrame(fade);
  }

  function togglePlay() {
    const audio = players[active];
    if (!started) return;
    if (audio.paused) {
      audio.play().then(() => {
        playBtn.textContent = "Ⅱ";
      }).catch(() => {
        playBtn.textContent = "▶";
      });
    } else {
      audio.pause();
      playBtn.textContent = "▶";
    }
  }

  function toggleMute() {
    muted = !muted;
    players[active].volume = muted ? 0 : volume;
    muteBtn.textContent = muted ? "🔇" : "🔊";
  }

  players.forEach(audio => {
    audio.addEventListener("error", () => {
      playBtn.textContent = "▶";
      moodEl.textContent = "File musik tidak dapat dibaca browser";
    });
  });

  volumeEl.addEventListener("input", e => setVolume(e.target.value));
  playBtn.addEventListener("click", togglePlay);
  muteBtn.addEventListener("click", toggleMute);

  return { start, crossfade, tracks };
})();
