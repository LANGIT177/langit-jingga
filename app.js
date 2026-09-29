// ============================================================
// LANGIT JINGGA — app.js
// Reader, navigasi bab, scene IntersectionObserver, localStorage.
// ============================================================

// Penyimpanan dibuat aman untuk file://. Beberapa browser dapat membatasi
// localStorage pada halaman yang dibuka langsung dari filesystem. Jika diblokir,
// reader tetap berjalan menggunakan penyimpanan sementara di memory.
const memoryStorage = {};
const storage = {
  get(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (e) {
      return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (e) {
      memoryStorage[key] = String(value);
    }
  }
};

const state = {
  chapter: Number(storage.get("lj_chapter", 1)),
  fontSize: Number(storage.get("lj_font_size", 19)),
  theme: storage.get("lj_theme", "light"),
  lastScene: null
};

const chapterFiles = [
  { id: 1, judul: "Empat Gelas" },
  { id: 2, judul: "Anak Teknik" },
  { id: 3, judul: "Bareng Aja" },
  { id: 4, judul: "Filmnya Biasa Aja" },
  { id: 5, judul: "Daftar di Ponsel" },
  { id: 6, judul: "Lunas" },
  { id: 7, judul: "Jam Tiga" },
  { id: 8, judul: "Yang Tertinggal" }
];

const chapters = Array.isArray(window.CHAPTERS) ? window.CHAPTERS : [];

const $ = s => document.querySelector(s);
const sceneContainer = $("#sceneContainer");
const chapterTitle = $("#chapterTitle");
const chapterNumber = $("#chapterNumber");

function applyTheme() {
  document.body.classList.toggle("dark", state.theme==="dark");
  $("#fontSize").value=state.fontSize;
  document.documentElement.style.setProperty("--reader-size", state.fontSize+"px");
}

function loadChapter(id, scroll=true) {
  const item=chapterFiles.find(x=>x.id===id);
  const data=chapters.find(x=>x.id===id);
  if(!item || !data) {
    chapterNumber.textContent = "DATA TIDAK TERMUAT";
    chapterTitle.textContent = chapters.length
      ? `Bab ${id} tidak ditemukan`
      : "Bab belum berhasil dimuat";
    sceneContainer.innerHTML = `
      <div class="scene-inner">
        <p class="paragraph">Data bab belum tersedia di halaman ini. Pastikan folder <strong>data</strong> berada satu tingkat dengan index.html dan file <strong>bab-1.js</strong> sampai <strong>bab-8.js</strong> ikut diekstrak.</p>
      </div>`;
    return;
  }

  state.chapter=id;
  storage.set("lj_chapter",id);
  chapterNumber.textContent=`BAB ${data.id}`;
  chapterTitle.textContent=data.judul;
  sceneContainer.innerHTML="";

  data.adegan.forEach((scene,index)=>{
    const article=document.createElement("article");
    article.className="scene";
    article.dataset.scene=scene.latar;
    article.dataset.music=scene.musik || "";
    article.id=`scene-${index+1}`;

    article.innerHTML=`
      <div class="scene-inner">
        <div class="scene-meta">
          <span class="pill">${scene.latar.replaceAll("_"," ")}</span>
          <span>${scene.mood}</span>
        </div>
        ${scene.paragraf.map(p=>`<p class="paragraph">${escapeHtml(p)}</p>`).join("")}
      </div>
    `;
    sceneContainer.appendChild(article);
  });

  bindSceneObserver();
  updateNav();
  renderToc();

  if(scroll) {
    const saved=storage.get(`lj_scroll_${id}`, "0");
    window.scrollTo({top:Number(saved||0), behavior:"instant"});
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

let observer;
function bindSceneObserver() {
  if(observer) observer.disconnect();

  observer=new IntersectionObserver(entries=>{
    const visible=entries
      .filter(e=>e.isIntersecting)
      .sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible) return;

    const el=visible.target;
    const scene=el.dataset.scene;
    const music=el.dataset.music;

    if(scene!==state.lastScene) {
      state.lastScene=scene;
      SceneEngine.setScene(scene);
    }
    if(music) AudioEngine.crossfade(music);
  }, { threshold:[0.2,0.45,0.7], rootMargin:"-15% 0px -45% 0px" });

  document.querySelectorAll(".scene").forEach(el=>observer.observe(el));
}

function updateNav() {
  const index=chapterFiles.findIndex(x=>x.id===state.chapter);
  $("#prevChapter").disabled=index<=0;
  $("#nextChapter").disabled=index>=chapterFiles.length-1;
}

function renderToc() {
  $("#chapterList").innerHTML=chapterFiles.map(ch=>`
    <button class="chapter-item" data-chapter="${ch.id}">
      <span>BAB ${ch.id}</span>
      <strong>${escapeHtml(ch.judul)}</strong>
    </button>
  `).join("");

  $("#chapterList").querySelectorAll("[data-chapter]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      $("#toc").classList.remove("open");
      loadChapter(Number(btn.dataset.chapter));
    });
  });
}

window.addEventListener("scroll",()=>{
  storage.set(`lj_scroll_${state.chapter}`,String(window.scrollY));
},{passive:true});

function getMusicForCurrentViewport() {
  const scenes = [...document.querySelectorAll(".scene")];
  if (!scenes.length) return "dulu_kita_masih_remaja";

  const targetY = window.scrollY + Math.min(window.innerHeight * 0.42, 420);
  let best = scenes[0];
  let bestDistance = Infinity;

  for (const scene of scenes) {
    const top = scene.offsetTop;
    const bottom = top + scene.offsetHeight;
    if (targetY >= top && targetY <= bottom) return scene.dataset.music || "dulu_kita_masih_remaja";
    const distance = targetY < top ? top - targetY : targetY - bottom;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = scene;
    }
  }

  return best.dataset.music || "dulu_kita_masih_remaja";
}

$("#startReading").addEventListener("click",async()=>{
  $("#startScreen").style.display="none";
  await AudioEngine.start(getMusicForCurrentViewport());
});

$("#menuButton").addEventListener("click",()=>$("#toc").classList.add("open"));
$("#closeToc").addEventListener("click",()=>$("#toc").classList.remove("open"));

$("#themeButton").addEventListener("click",()=>{
  state.theme=state.theme==="dark"?"light":"dark";
  storage.set("lj_theme",state.theme);
  applyTheme();
});

$("#settingsButton").addEventListener("click",()=>{
  $("#textSettings").hidden=!$("#textSettings").hidden;
});

$("#fontSize").addEventListener("input",e=>{
  state.fontSize=Number(e.target.value);
  storage.set("lj_font_size",state.fontSize);
  document.documentElement.style.setProperty("--reader-size",state.fontSize+"px");
});

$("#prevChapter").addEventListener("click",()=>{
  const i=chapterFiles.findIndex(x=>x.id===state.chapter);
  if(i>0) loadChapter(chapterFiles[i-1].id);
});
$("#nextChapter").addEventListener("click",()=>{
  const i=chapterFiles.findIndex(x=>x.id===state.chapter);
  if(i<chapterFiles.length-1) loadChapter(chapterFiles[i+1].id);
});

applyTheme();
renderToc();
loadChapter(state.chapter, false);
