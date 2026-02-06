
/* Registro Iglesia — Offline (localStorage) */
const LS_KEY = "iglesia_db_v1";

function nowISODate(){
  const d = new Date();
  const tz = new Date(d.getTime() - d.getTimezoneOffset()*60000);
  return tz.toISOString().slice(0,10);
}
function uid(){
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function loadDB(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return { miembros: [], evangelizados: [] };
    const db = JSON.parse(raw);
    db.miembros ??= [];
    db.evangelizados ??= [];
    return db;
  }catch(e){
    return { miembros: [], evangelizados: [] };
  }
}
function saveDB(db){
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}
function byName(a,b){
  return (a.NombreCompleto||"").localeCompare(b.NombreCompleto||"", "es", {sensitivity:"base"});
}
function photoToDataURL(file){
  return new Promise((resolve,reject)=>{
    if(!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function esc(s){ return (s??"").toString().replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

const db = loadDB();

/* UI refs */
const tabs = document.querySelectorAll(".tab");
const panels = {
  miembros: document.getElementById("panel-miembros"),
  evangelizados: document.getElementById("panel-evangelizados"),
};
const listMiembros = document.getElementById("listMiembros");
const listEvan = document.getElementById("listEvan");
const qMiembros = document.getElementById("qMiembros");
const qEvan = document.getElementById("qEvan");
const fSede = document.getElementById("fSede");
const fEstado = document.getElementById("fEstado");

const dlgForm = document.getElementById("dlgForm");
const form = document.getElementById("formEntity");
const formTitle = document.getElementById("formTitle");
const entityType = document.getElementById("entityType");
const entityId = document.getElementById("entityId");
const btnDelete = document.getElementById("btnDelete");

const dlgAbout = document.getElementById("dlgAbout");
document.getElementById("btnAbout").addEventListener("click", ()=> dlgAbout.showModal());

/* Tabs */
tabs.forEach(t=>{
  t.addEventListener("click", ()=>{
    tabs.forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    const tab = t.dataset.tab;
    Object.values(panels).forEach(p=>p.classList.remove("active"));
    panels[tab].classList.add("active");
  });
});

/* Render */
function renderMiembros(){
  const q = (qMiembros.value||"").trim().toLowerCase();
  const sede = fSede.value || "";
  const rows = db.miembros
    .filter(m=>{
      const matchQ = !q || (m.NombreCompleto||"").toLowerCase().startsWith(q) || (m.Telefono||"").toLowerCase().startsWith(q);
      const matchS = !sede || (m.SedeIglesia||"") === sede;
      return matchQ && matchS;
    })
    .sort(byName);

  listMiembros.innerHTML = rows.length ? "" : `<div class="muted">No hay miembros todavía.</div>`;
  for(const m of rows){
    const img = m.FotoDataUrl ? `<img alt="Foto" src="${m.FotoDataUrl}">` : "👤";
    const badge = m.Activo === false ? `<span class="badge">Inactivo</span>` : `<span class="badge">Activo</span>`;
    const desc = `${esc(m.Telefono||"")} • ${esc(m.SedeIglesia||"")}`;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="left">
        <div class="avatar">${img}</div>
        <div class="meta">
          <div class="name">${esc(m.NombreCompleto)}</div>
          <div class="desc">${desc}</div>
        </div>
      </div>
      <div class="right">
        ${badge}
        <button class="btn btn-ghost" data-open="${m.id}">Abrir</button>
      </div>
    `;
    card.querySelector("[data-open]").addEventListener("click", ()=> openForm("miembros", m.id));
    listMiembros.appendChild(card);
  }
}
function renderEvan(){
  const q = (qEvan.value||"").trim().toLowerCase();
  const estado = fEstado.value || "";
  const rows = db.evangelizados
    .filter(e=>{
      const matchQ = !q || (e.NombreCompleto||"").toLowerCase().startsWith(q) || (e.Telefono||"").toLowerCase().startsWith(q);
      const matchE = !estado || (e.EstadoSeguimiento||"") === estado;
      return matchQ && matchE;
    })
    .sort(byName);

  listEvan.innerHTML = rows.length ? "" : `<div class="muted">No hay evangelizados todavía.</div>`;
  for(const e of rows){
    const img = e.FotoDataUrl ? `<img alt="Foto" src="${e.FotoDataUrl}">` : "🧑‍🤝‍🧑";
    const badge = `<span class="badge">${esc(e.EstadoSeguimiento||"")}</span>`;
    const prox = e.ProximoContacto ? ` • Próx: ${esc(e.ProximoContacto)}` : "";
    const desc = `${esc(e.Telefono||"")} • ${esc(e.FechaEvangelizacion||"")}${prox}`;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="left">
        <div class="avatar">${img}</div>
        <div class="meta">
          <div class="name">${esc(e.NombreCompleto)}</div>
          <div class="desc">${desc}</div>
        </div>
      </div>
      <div class="right">
        ${badge}
        <button class="btn btn-ghost" data-open="${e.id}">Abrir</button>
      </div>
    `;
    card.querySelector("[data-open]").addEventListener("click", ()=> openForm("evangelizados", e.id));
    listEvan.appendChild(card);
  }
}

/* Form helpers */
function setOnly(type){
  document.querySelectorAll(".only-miembros").forEach(el=> el.style.display = (type==="miembros") ? "contents" : "none");
  document.querySelectorAll(".only-evangelizados").forEach(el=> el.style.display = (type==="evangelizados") ? "contents" : "none");
  // Observaciones general visible both
}
function fillField(id, val){
  const el = document.getElementById(id);
  if(!el) return;
  if(el.type === "checkbox") el.checked = !!val;
  else el.value = val ?? "";
}
function readField(id){
  const el = document.getElementById(id);
  if(!el) return undefined;
  if(el.type === "checkbox") return el.checked;
  return (el.value ?? "").trim();
}
function clearFileInput(){
  const f = document.getElementById("Foto");
  if(f) f.value = "";
}

async function openForm(type, id=null){
  entityType.value = type;
  entityId.value = id || "";
  setOnly(type);
  clearFileInput();

  const isEdit = !!id;
  btnDelete.style.display = isEdit ? "inline-flex" : "none";

  if(type==="miembros"){
    formTitle.textContent = isEdit ? "Editar miembro" : "Nuevo miembro";
    const m = isEdit ? db.miembros.find(x=>x.id===id) : null;
    fillField("NombreCompleto", m?.NombreCompleto);
    fillField("Telefono", m?.Telefono);
    fillField("DNI", m?.DNI);
    fillField("FechaNacimiento", m?.FechaNacimiento);
    fillField("WhatsApp", m?.WhatsApp);
    fillField("Direccion", m?.Direccion);
    fillField("Barrio", m?.Barrio);
    fillField("Ciudad", m?.Ciudad);
    fillField("EstadoCivil", m?.EstadoCivil);
    fillField("FechaLlegada", m?.FechaLlegada);
    fillField("SedeIglesia", m?.SedeIglesia || "Vicente López");
    fillField("Responsable", m?.Responsable);
    fillField("Bautizado", m?.Bautizado);
    fillField("FechaBautismo", m?.FechaBautismo);
    fillField("Activo", m?.Activo ?? true);
    fillField("Observaciones", m?.Observaciones);
    // Evan-only fields reset for validation
    fillField("FechaEvangelizacion", nowISODate());
    fillField("Evangelizador", "");
    fillField("EstadoSeguimiento", "Nuevo");
    fillField("ObservacionesEvan", "");
  } else {
    formTitle.textContent = isEdit ? "Editar evangelizado" : "Nuevo evangelizado";
    const e = isEdit ? db.evangelizados.find(x=>x.id===id) : null;
    fillField("NombreCompleto", e?.NombreCompleto);
    fillField("Telefono", e?.Telefono);
    fillField("FechaEvangelizacion", e?.FechaEvangelizacion || nowISODate());
    fillField("LugarContacto", e?.LugarContacto);
    fillField("MotivoPedido", e?.MotivoPedido);
    fillField("Evangelizador", e?.Evangelizador);
    fillField("InvitadoA", e?.InvitadoA);
    fillField("Asistio", e?.Asistio);
    fillField("FechaAsistencia", e?.FechaAsistencia);
    fillField("EstadoSeguimiento", e?.EstadoSeguimiento || "Nuevo");
    fillField("ProximoContacto", e?.ProximoContacto);
    fillField("ObservacionesEvan", e?.Observaciones);
    fillField("MiembroRelacionadoID", e?.MiembroRelacionadoID);
    // Miembros-only defaults
    fillField("SedeIglesia", "Vicente López");
    fillField("Responsable", "");
    fillField("Activo", true);
    fillField("Observaciones", "");
  }

  dlgForm.showModal();
}

document.getElementById("btnNewMiembro").addEventListener("click", ()=> openForm("miembros", null));
document.getElementById("btnNewEvan").addEventListener("click", ()=> openForm("evangelizados", null));

qMiembros.addEventListener("input", renderMiembros);
fSede.addEventListener("change", renderMiembros);
qEvan.addEventListener("input", renderEvan);
fEstado.addEventListener("change", renderEvan);

/* Save */
form.addEventListener("submit", async (ev)=>{
  ev.preventDefault();
  const type = entityType.value;
  const id = entityId.value || null;
  const file = document.getElementById("Foto").files?.[0] || null;

  const base = {
    id: id || uid(),
    NombreCompleto: readField("NombreCompleto"),
    Telefono: readField("Telefono"),
  };

  // photo: only overwrite if selected
  const photoData = file ? await photoToDataURL(file) : null;

  if(type==="miembros"){
    const obj = {
      ...base,
      DNI: readField("DNI"),
      FechaNacimiento: readField("FechaNacimiento"),
      WhatsApp: readField("WhatsApp"),
      Direccion: readField("Direccion"),
      Barrio: readField("Barrio"),
      Ciudad: readField("Ciudad"),
      EstadoCivil: readField("EstadoCivil"),
      FechaLlegada: readField("FechaLlegada"),
      SedeIglesia: readField("SedeIglesia"),
      Responsable: readField("Responsable"),
      Bautizado: readField("Bautizado"),
      FechaBautismo: readField("FechaBautismo"),
      Activo: readField("Activo"),
      Observaciones: readField("Observaciones"),
      updatedAt: new Date().toISOString(),
    };
    if(photoData) obj.FotoDataUrl = photoData;

    const idx = db.miembros.findIndex(x=>x.id===obj.id);
    if(idx>=0) db.miembros[idx] = { ...db.miembros[idx], ...obj };
    else db.miembros.push({ ...obj, createdAt: new Date().toISOString() });

  } else {
    const obj = {
      ...base,
      FechaEvangelizacion: readField("FechaEvangelizacion"),
      LugarContacto: readField("LugarContacto"),
      MotivoPedido: readField("MotivoPedido"),
      Evangelizador: readField("Evangelizador"),
      InvitadoA: readField("InvitadoA"),
      Asistio: readField("Asistio"),
      FechaAsistencia: readField("FechaAsistencia"),
      EstadoSeguimiento: readField("EstadoSeguimiento"),
      ProximoContacto: readField("ProximoContacto"),
      Observaciones: readField("ObservacionesEvan"),
      MiembroRelacionadoID: readField("MiembroRelacionadoID"),
      updatedAt: new Date().toISOString(),
    };
    if(photoData) obj.FotoDataUrl = photoData;

    const idx = db.evangelizados.findIndex(x=>x.id===obj.id);
    if(idx>=0) db.evangelizados[idx] = { ...db.evangelizados[idx], ...obj };
    else db.evangelizados.push({ ...obj, createdAt: new Date().toISOString() });
  }

  saveDB(db);
  dlgForm.close();
  renderMiembros(); renderEvan();
});

/* Delete */
btnDelete.addEventListener("click", ()=>{
  const type = entityType.value;
  const id = entityId.value;
  if(!id) return;
  const ok = confirm("¿Eliminar este registro?");
  if(!ok) return;
  if(type==="miembros"){
    const idx = db.miembros.findIndex(x=>x.id===id);
    if(idx>=0) db.miembros.splice(idx,1);
  }else{
    const idx = db.evangelizados.findIndex(x=>x.id===id);
    if(idx>=0) db.evangelizados.splice(idx,1);
  }
  saveDB(db);
  dlgForm.close();
  renderMiembros(); renderEvan();
});

/* Export / Import */
function download(filename, text){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], {type:"application/json"}));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
document.getElementById("btnExport").addEventListener("click", ()=>{
  const payload = { version: 1, exportedAt: new Date().toISOString(), db };
  const name = `iglesia_db_${new Date().toISOString().slice(0,10)}.json`;
  download(name, JSON.stringify(payload, null, 2));
});

document.getElementById("fileImport").addEventListener("change", async (ev)=>{
  const file = ev.target.files?.[0];
  if(!file) return;
  try{
    const text = await file.text();
    const payload = JSON.parse(text);
    if(!payload?.db) throw new Error("Formato inválido");
    const ok = confirm("¿Importar y REEMPLAZAR la base actual en este dispositivo?");
    if(!ok) return;
    db.miembros = payload.db.miembros || [];
    db.evangelizados = payload.db.evangelizados || [];
    saveDB(db);
    renderMiembros(); renderEvan();
    alert("Importación OK.");
  }catch(e){
    alert("No se pudo importar: " + (e.message||e));
  }finally{
    ev.target.value = "";
  }
});

/* Init */
(function init(){
  // default date in form
  document.getElementById("FechaEvangelizacion").value = nowISODate();
  renderMiembros();
  renderEvan();
})();
