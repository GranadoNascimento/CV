let view, visibleFeatures = [], index = -1, tourInterval = null, isFlying = false, animationHandle = null, features = [], layer;

const DEFAULT_CAMERA = { position: { longitude: -10, latitude: 20, z: 18000000 }, tilt: 0, heading: 0 };
const TOUR_INTERVAL_MS = 8000;
const FLY_DURATION_MS = 3500;
const FLY_TILT = 65;
const FLY_Z = 1200;
const FLY_LAT_OFFSET_DESKTOP = 0.008;
const FLY_LAT_OFFSET_MOBILE = 0.025;
const ROTATE_STEP_DEG = 0.1;
const MOBILE_BREAKPOINT = 768;

// Exposed on window so inline onclick handlers in index.html can reach them
let typewriterActive = true;
window.closeSplash = () => {
    typewriterActive = false;
    document.getElementById('splash').style.opacity = '0';
    setTimeout(() => document.getElementById('splash').style.display = 'none', 800);
};

// Terminal-style typewriter: types each phrase, pauses, deletes it, then moves to the next.
const TYPEWRITER_PHRASES = ["Desenvolvedor RPA & IA", "Tech Lead & Arquiteto de Soluções"];
const TYPE_MS = 70, DELETE_MS = 35, PAUSE_MS = 1800, NEXT_PHRASE_DELAY_MS = 400;

const runTypewriter = () => {
  const el = document.getElementById("typedRole");
  if (!el) return;
  let phraseIdx = 0, charIdx = 0, deleting = false;
  const tick = () => {
    if (!typewriterActive) return;
    const phrase = TYPEWRITER_PHRASES[phraseIdx];
    if (!deleting) {
      charIdx++;
      el.textContent = phrase.slice(0, charIdx);
      if (charIdx === phrase.length) { deleting = true; setTimeout(tick, PAUSE_MS); return; }
      setTimeout(tick, TYPE_MS);
    } else {
      charIdx--;
      el.textContent = phrase.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % TYPEWRITER_PHRASES.length;
        setTimeout(tick, NEXT_PHRASE_DELAY_MS);
        return;
      }
      setTimeout(tick, DELETE_MS);
    }
  };
  tick();
};
runTypewriter();

window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('mobileToggle');
    if (!sidebar || !btn) return;
    sidebar.classList.toggle('minimized');
    btn.innerHTML = sidebar.classList.contains('minimized') ? "︽ Maximizar Lista e Filtros" : "︾ Minimizar Lista";
};

require([
  "esri/Map", "esri/views/SceneView", "esri/layers/GeoJSONLayer",
  "esri/widgets/BasemapGallery", "esri/widgets/Daylight", 
  "esri/widgets/DirectLineMeasurement3D", "esri/widgets/Expand"
], (Map, SceneView, GeoJSONLayer, BasemapGallery, Daylight, DirectLineMeasurement3D, Expand) => {

  const createSymbol = (color) => ({
    type: "point-3d", symbolLayers: [{ type: "icon", resource: { primitive: "circle" }, size: 16, material: { color }, outline: { color: "white", size: 2 } }],
    verticalOffset: { screenLength: 60 }, callout: { type: "line", color: "white", size: 2 }
  });

  const getInitials = (name) => {
    const words = name.split(/\s+/).filter(Boolean);
    return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : words.slice(0, 2).map(w => w[0]).join("").toUpperCase();
  };

  // Returns a logo <img> (falling back to an initials badge on missing/broken image) as a real DOM node,
  // since Esri's popup strips inline onerror attributes when content is inserted as an HTML string.
  const companyBadge = (company, logo) => {
    const initialsDiv = document.createElement("div");
    initialsDiv.className = "company-initials";
    initialsDiv.textContent = getInitials(company);
    if (!logo) return initialsDiv;
    const img = document.createElement("img");
    img.src = logo;
    img.className = "company-logo";
    img.alt = company;
    img.addEventListener("error", () => img.replaceWith(initialsDiv), { once: true });
    return img;
  };

  layer = new GeoJSONLayer({
    url: "data/career.geojson",
    outFields: ["*"], elevationInfo: { mode: "relative-to-ground" },
    labelingInfo: [{
      labelPlacement: "above-center", labelExpressionInfo: { expression: "$feature.company" },
      symbol: { type: "label-3d", symbolLayers: [{ type: "text", material: { color: "white" }, halo: { color: "black", size: 1 }, size: 10, font: { weight: "bold" } }] }
    }],
    renderer: {
      type: "unique-value", field: "career_phase",
      uniqueValueInfos: [
        { value: "Junior", symbol: createSymbol("#22c55e") },
        { value: "Pleno", symbol: createSymbol("#0ea5e9") },
        { value: "Senior", symbol: createSymbol("#a855f7") },
        { value: "TechLead", symbol: createSymbol("#f97316") }
      ]
    },
    popupTemplate: {
      title: "{city}, {country}",
      content: (e) => {
        const a = e.graphic.attributes;
        const chips = (a.stack || "").split(",").map(s => `<span class="chip">${s.trim()}</span>`).join("");
        const container = document.createElement("div");
        container.className = "popup-timeline";
        container.innerHTML = `<div class="role-item">
            <div class="role-company-wrap"></div>
            <div style="font-size:13px; font-weight:700; margin:4px 0;">${a.role}</div>
            <p class="role-description">${a.description}</p>
            <div class="chip-wrap">${chips}</div>
          </div>`;
        const wrap = container.querySelector(".role-company-wrap");
        wrap.appendChild(companyBadge(a.company, a.logo));
        wrap.insertAdjacentHTML("beforeend", `<div class="role-company">${a.company}</div>`);
        return container;
      }
    }
  });

  view = new SceneView({
    container: "viewDiv",
    map: new Map({ basemap: "dark-gray-3d", layers: [layer] }),
    camera: DEFAULT_CAMERA,
    popup: { dockEnabled: true, dockOptions: { position: "bottom-right", breakpoint: false } }
  });

  const rotate = () => { if(!animationHandle) return; const cam = view.camera.clone(); cam.position.longitude -= ROTATE_STEP_DEG; view.camera = cam; animationHandle = requestAnimationFrame(rotate); };
  window.startRot = () => { if(!animationHandle) { animationHandle = true; rotate(); } };
  window.stopRot = () => { animationHandle = null; };

  window.fly = async (i) => {
    if (isFlying || !visibleFeatures[i]) return;
    isFlying = true; window.stopRot(); index = i;
    const target = visibleFeatures[i];
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    if (isMobile) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('minimized')) window.toggleSidebar();
    }

    const latOffset = isMobile ? FLY_LAT_OFFSET_MOBILE : FLY_LAT_OFFSET_DESKTOP;
    await view.goTo({ position: { longitude: target.geometry.longitude, latitude: target.geometry.latitude - latOffset, z: FLY_Z }, tilt: FLY_TILT, heading: 0 }, { duration: FLY_DURATION_MS });
    view.openPopup({ features: [target], updateLocationEnabled: true });
    window.rebuildList(); 
    isFlying = false;
  };

  window.toggleTour = () => {
    const tourBtn = document.getElementById("tourBtn");
    if (tourInterval) {
        clearInterval(tourInterval); tourInterval = null;
        tourBtn.textContent = "▶ Iniciar Tour Automático";
        tourBtn.classList.remove("active-tour");
    } else {
        if (!visibleFeatures.length) return;
        tourBtn.textContent = "■ Parar Tour";
        tourBtn.classList.add("active-tour");
        // visibleFeatures is sorted most-recent-first, so the tour starts at the last
        // index (oldest experience) and walks backward toward the most recent, stopping
        // once it reaches it instead of looping back around.
        let tourIdx = visibleFeatures.length - 1;
        const step = () => {
          if (!tourInterval) return;
          window.fly(tourIdx);
          if (tourIdx === 0) { window.toggleTour(); return; }
          tourIdx -= 1;
        };
        tourInterval = setInterval(step, TOUR_INTERVAL_MS);
        step();
    }
  };

  window.rebuildList = () => {
    const list = document.getElementById("list"); 
    if(!list) return;
    list.innerHTML = "";
    visibleFeatures.forEach((f, i) => {
      const a = f.attributes;
      const d = document.createElement("div");
      d.className = "card" + (i === index ? " active" : "") + (a.career_phase === "TechLead" ? " card-techlead" : "");
      d.innerHTML = `<div class="card-header"></div><div class="card-sub"><span>${a.city}</span></div>`;
      const header = d.querySelector(".card-header");
      header.appendChild(companyBadge(a.company, a.logo));
      header.insertAdjacentHTML("beforeend", `<b>${a.company}</b>`);
      d.onclick = () => { if(tourInterval) window.toggleTour(); window.fly(i); };
      list.appendChild(d);
    });
  };

  window.applyFilters = () => {
    const country = document.getElementById("countryFilter").value;
    const phase = document.getElementById("phaseFilter").value;
    // Two filters, two jobs: visibleFeatures drives the sidebar list/tour,
    // definitionExpression drives what the 3D layer actually renders.
    visibleFeatures = features.filter(f => (country === "ALL" || f.attributes.country === country) && (phase === "ALL" || f.attributes.career_phase === phase));
    let sql = [];
    if (country !== "ALL") sql.push(`country = '${country}'`);
    if (phase !== "ALL") sql.push(`career_phase = '${phase}'`);
    layer.definitionExpression = sql.length > 0 ? sql.join(" AND ") : null;
    index = -1; window.rebuildList();
  };

  view.when(() => {
    view.ui.add(new Expand({ view, content: new BasemapGallery({ view }), expandIconClass: "esri-icon-basemap", group: "top-right" }), "top-right");
    view.ui.add(new Expand({
      view,
      content: new Daylight({ view }),
      expandIconClass: "esri-icon-sunny",
      group: "top-right"
    }), "top-right");
    view.ui.add(new Expand({ view, content: new DirectLineMeasurement3D({ view }), expandIconClass: "esri-icon-measure-line", group: "top-right" }), "top-right");

    layer.queryFeatures().then(res => {
      features = res.features.sort((a,b) => (a.attributes.order || 0) - (b.attributes.order || 0));
      visibleFeatures = [...features];
      const cf = document.getElementById("countryFilter");
      [...new Set(features.map(f => f.attributes.country))].sort().forEach(c => {
        const o = document.createElement("option"); o.value = o.textContent = c; cf.appendChild(o);
      });
      window.rebuildList(); window.startRot();
    }).catch(err => {
      console.error("Error loading GeoJSON data:", err);
      const list = document.getElementById("list");
      if (list) list.innerHTML = `<p style="color:#f97316;padding:12px;">Não foi possível carregar os dados da carreira. Tente novamente mais tarde.</p>`;
    });
  });

  document.getElementById("countryFilter").onchange = window.applyFilters;
  document.getElementById("phaseFilter").onchange = window.applyFilters;
  document.getElementById("resetBtn").onclick = () => {
    if(tourInterval) window.toggleTour();
    view.goTo(DEFAULT_CAMERA, { duration: 3000 })
    .then(() => { window.startRot(); index = -1; window.rebuildList(); });
  };
});

