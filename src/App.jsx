import React, { useEffect, useMemo, useState } from "react";

// ---------------- Error Boundary ----------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("UI error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, background: "#111827", color: "#fff", minHeight: "100vh" }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Se cayó la vista 😅</div>
          <div style={{ fontSize: 12, opacity: 0.85, whiteSpace: "pre-wrap" }}>{String(this.state.error)}</div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, border: "1px solid #ffffff22", background: "#e11d48", color: "#fff" }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Casa Alofoke — Página 1-tab (preview) con estado compartido
 */

const DEFAULTS = {
  brand: "#0b0f17",
  accent: "#e11d48",
  ytId: "gOJvu0xYsdo",
  countApiNS: "casa-alofoke",
  visitsKey: "visitas",
};

const ADMIN = { user: "Alofoke", pass: "PrinceMatias1" };
// Token para escritura remota (por simplicidad, igual al pass)
const REMOTE_WRITE_TOKEN = ADMIN.pass;
const REMOTE_STATE_URL = "/api/state";

// Hora de inicio del show (11 Ago 2025, 9:00 PM ET = 12 Ago 2025 01:00:00 UTC)
const SHOW_START_UTC_MS = Date.UTC(2025, 7, 12, 1, 0, 0);
const SHOW_START_LABEL = "11 Ago 2025 · 9:00 PM ET";

function cryptoRandom() {
  try {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const a = new Uint32Array(2);
      crypto.getRandomValues(a);
      return a[0].toString(36) + a[1].toString(36);
    }
  } catch {}
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function defaultRoster() {
  return [
    { id: cryptoRandom(), name: "Mami Kim", votes: 2690, ig: "mamikimreal" },
    { id: cryptoRandom(), name: "Vladimir Gómez", votes: 0, ig: "justvladyg" },
    { id: cryptoRandom(), name: "Crusita", votes: 0, ig: "crusita___" },
    { id: cryptoRandom(), name: "Luise", votes: 0, ig: "luisemartinezz12" },
    { id: cryptoRandom(), name: "La Gigi", votes: 0, ig: "lagigird" },
    { id: cryptoRandom(), name: "Karola", votes: 0, ig: "karolalcendra_" },
    { id: cryptoRandom(), name: "La Peki", votes: 0, ig: "lapekipr" },
    { id: cryptoRandom(), name: "Crazy Design", votes: 0, ig: "crazydesignrd" },
    { id: cryptoRandom(), name: "Sr. Jiménez", votes: 0, ig: "yosoyjimenez_" },
    { id: cryptoRandom(), name: "Giuseppe Benignini", votes: 0, ig: "gbenignini" },
  ];
}

// ------- helpers -------
function getInitials(name = "?") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

function Avatar({ name, ig, img, size = 40 }) {
  const src = img?.trim() || (ig ? `https://unavatar.io/instagram/${ig}` : "");
  const initials = getInitials(name);
  return (
    <div style={{ position: "relative", width: size, height: size }} aria-label={name} title={name}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "9999px",
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(2px)",
        }}
      >
        {initials}
      </div>
      {src && (
        <img
          src={src}
          alt={name}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.10)" }}
        />
      )}
    </div>
  );
}

function SectionCard({ title, children, subtitle }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>{subtitle}</div>}
      </div>
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}

function Pill({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ fontSize: 12, padding: "8px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff" }}>{children}</button>
  );
}

// Viewport helper (para responsive sin Tailwind)
function useWindowWidth() {
  const [w, setW] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  React.useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
}

// ---------------- Main ----------------
function AlofokeFanOneTab() {
  const [brand, setBrand] = useState(DEFAULTS.brand);
  const [accent, setAccent] = useState(DEFAULTS.accent);
  const [ytId, setYtId] = useState(DEFAULTS.ytId);
  const [visits, setVisits] = useState(null);
  const [editing, setEditing] = useState(false);

  const [roster, setRoster] = useState(() => {
    try {
      const savedRoster = JSON.parse(localStorage.getItem("alofoke_roster") || "null");
      if (Array.isArray(savedRoster) && savedRoster.length) return savedRoster;
    } catch {}
    return defaultRoster();
  });

  const [temp, setTemp] = useState(() => ({ brand: DEFAULTS.brand, accent: DEFAULTS.accent, ytId: DEFAULTS.ytId, roster }));

  // Auth
  const [authOpen, setAuthOpen] = useState(false);
  const [authForm, setAuthForm] = useState({ user: "", pass: "" });
  const [authErr, setAuthErr] = useState("");

  const nf = useMemo(() => new Intl.NumberFormat(), []);
  const pf = useMemo(() => new Intl.NumberFormat(undefined, { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 1 }), []);
  const percent = (v, t) => (t > 0 ? v / t : 0);

  // Cargar config desde localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("alofoke_config") || "null");
      if (saved) {
        if (saved.brand) setBrand(saved.brand);
        if (saved.accent) setAccent(saved.accent);
        if (saved.ytId) setYtId(saved.ytId);
      }
    } catch {}
  }, []);

  // Aplicar colores
  useEffect(() => {
    try {
      const r = document.documentElement.style;
      r.setProperty("--brand", brand);
      r.setProperty("--accent", accent);
    } catch {}
  }, [brand, accent]);

  // Cargar estado compartido (Cloudflare KV) si existe
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(REMOTE_STATE_URL, { cache: 'no-store' });
        const data = await r.json().catch(() => null);
        if (data && (data.brand || data.accent || data.ytId || Array.isArray(data.roster))) {
          if (data.brand) setBrand(data.brand);
          if (data.accent) setAccent(data.accent);
          if (data.ytId) setYtId(data.ytId);
          if (Array.isArray(data.roster)) setRoster(data.roster);
          try {
            localStorage.setItem("alofoke_config", JSON.stringify({ brand: data.brand || DEFAULTS.brand, accent: data.accent || DEFAULTS.accent, ytId: data.ytId || DEFAULTS.ytId }));
            localStorage.setItem("alofoke_roster", JSON.stringify(Array.isArray(data.roster) ? data.roster : []));
          } catch {}
        }
      } catch (e) {
        console.warn("No se pudo cargar estado remoto:", e?.message || e);
      }
    })();
  }, []);

  // CountAPI (super defensivo)
  useEffect(() => {
    let cancelled = false;
    const go = async () => {
      try {
        if (typeof fetch !== "function") throw new Error("fetch no disponible");
        const url = `https://api.countapi.xyz/hit/${encodeURIComponent(DEFAULTS.countApiNS)}/${encodeURIComponent(DEFAULTS.visitsKey)}`;
        const r = await fetch(url).catch(() => null);
        const data = await r?.json().catch(() => ({}));
        if (!cancelled) setVisits(typeof data?.value === "number" ? data.value : 1);
      } catch {
        if (!cancelled) setVisits(1);
      }
    };
    go();
    return () => { cancelled = true; };
  }, []);

  const liveCounts = useMemo(() => {
    const id = encodeURIComponent((ytId || "").trim());
    return {
      embed: `https://livecounts.io/embed/youtube-live-view-counter/${id}`,
      page: `https://livecounts.io/youtube-live-view-counter/${id}`,
    };
  }, [ytId]);

  const ytPlayer = useMemo(() => {
    const raw = (ytId || "").trim();
    const isChannel = /^UC[a-zA-Z0-9_-]{22}$/.test(raw);
    const id = encodeURIComponent(raw);
    const embed = isChannel
      ? `https://www.youtube.com/embed/live_stream?channel=${id}&autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`
      : `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`;
    const page = isChannel
      ? `https://www.youtube.com/channel/${id}/live`
      : `https://www.youtube.com/watch?v=${id}`;
    return { embed, page, isChannel };
  }, [ytId]);

  const leaders = useMemo(() => {
    const sorted = [...roster].sort((a, b) => b.votes - a.votes);
    const total = roster.reduce((acc, p) => acc + (Number.isFinite(p.votes) ? Number(p.votes) : 0), 0);
    if (!sorted.length) return { sorted, top: null, ties: [], total };
    const top = sorted[0];
    const ties = sorted.filter((p) => p.votes === top.votes).map((p) => p.id);
    return { sorted, top, ties, total };
  }, [roster]);

  // Self-tests no intrusivos
  useEffect(() => {
    try {
      const testRoster = [ { id: "a", name: "A", votes: 10 }, { id: "b", name: "B", votes: 30 }, { id: "c", name: "C", votes: 20 } ];
      const s = [...testRoster].sort((x, y) => y.votes - x.votes);
      console.assert(s[0].id === "b" && s[1].id === "c" && s[2].id === "a", "Orden de ranking incorrecto");
      const t2 = [ { id: "a", name: "A", votes: 5 }, { id: "b", name: "B", votes: 5 } ];
      const top2 = t2[0];
      const ties2 = t2.filter((p) => p.votes === top2.votes).map((p) => p.id);
      console.assert(ties2.length === 2, "Empate no detectado");
      const pct = (v, t) => (t > 0 ? v / t : 0);
      console.assert(pct(25, 100) === 0.25, "Porcentaje mal calculado");
      console.assert(pct(5, 0) === 0, "Protección por cero falló");
      console.assert(getInitials("Juan Perez") === "JP", "Iniciales incorrectas (JP)");
      console.assert(getInitials("Ana") === "A", "Iniciales incorrectas (A)");
      console.assert(ADMIN.user === "Alofoke" && ADMIN.pass === "PrinceMatias1", "Credenciales distintas a las pedidas");
      const t7 = [{ votes: 1 }, { votes: 1 }, { votes: 2 }];
      const total7 = t7.reduce((a, b) => a + b.votes, 0);
      const sumPct = t7.reduce((a, b) => a + b.votes / total7, 0);
      console.assert(Math.abs(sumPct - 1) < 1e-9, "La suma de porcentajes no es 100%");
      const sampleChannel = "UC1234567890123456789012";
      console.assert(/^UC[a-zA-Z0-9_-]{22}$/.test(sampleChannel) === true, "Regex canal YouTube no detecta correctamente");
    } catch (e) {
      console.warn("Self-tests saltados:", e?.message || e);
    }
  }, []);

  // Auth helpers
  const isAuthed = () => {
    try { return localStorage.getItem("alofoke_admin") === "ok" || sessionStorage.getItem("alofoke_admin") === "ok"; } catch { return false; }
  };
  const openSettings = () => {
    if (isAuthed()) {
      setTemp({ brand, accent, ytId, roster });
      setEditing(true);
    } else {
      setAuthForm({ user: "", pass: "" });
      setAuthErr("");
      setAuthOpen(true);
    }
  };
  const handleLogin = () => {
    const u = (authForm.user || "").trim();
    const p = (authForm.pass || "").trim();
    if (u === ADMIN.user && p === ADMIN.pass) {
      try { localStorage.setItem("alofoke_admin", "ok"); sessionStorage.setItem("alofoke_admin", "ok"); } catch {}
      setAuthOpen(false); setAuthErr(""); setEditing(true); setTemp({ brand, accent, ytId, roster });
    } else {
      setAuthErr("Usuario o contraseña incorrectos");
    }
  };
  const handleLogout = () => { try { localStorage.removeItem("alofoke_admin"); sessionStorage.removeItem("alofoke_admin"); } catch {}; setEditing(false); };

  const saveConfig = () => {
    const cleanBrand = (temp.brand || brand).trim();
    const cleanAccent = (temp.accent || accent).trim();
    const cleanYt = (temp.ytId || ytId).trim();
    setBrand(cleanBrand); setAccent(cleanAccent); setYtId(cleanYt);
    try { localStorage.setItem("alofoke_config", JSON.stringify({ brand: cleanBrand, accent: cleanAccent, ytId: cleanYt })); } catch {}
    const cleanRoster = (temp.roster || [])
      .map((r) => ({ ...r, name: (r.name || "").trim(), ig: (r.ig || "").replace(/@/g, "").trim(), img: (r.img || "").trim() }))
      .filter((r) => r.name.length > 0)
      .map((r) => ({ ...r, votes: Number.isFinite(r.votes) ? Number(r.votes) : 0 }));
    setRoster(cleanRoster);
    try { localStorage.setItem("alofoke_roster", JSON.stringify(cleanRoster)); } catch {}
    setEditing(false);

    // Guardar estado compartido (Cloudflare KV)
    try {
      const body = { brand: cleanBrand, accent: cleanAccent, ytId: cleanYt, roster: cleanRoster };
      fetch(REMOTE_STATE_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin': REMOTE_WRITE_TOKEN },
        body: JSON.stringify(body)
      }).then(async (r) => {
        if (!r.ok) {
          const t = await r.text();
          console.warn('POST remoto falló', r.status, t);
        }
      }).catch((e) => console.warn('POST remoto error', e?.message || e));
    } catch (e) { console.warn('No se pudo guardar remoto:', e?.message || e); }
  };

  const colors = {
    text60: "rgba(255,255,255,0.6)",
    text70: "rgba(255,255,255,0.7)",
    text50: "rgba(255,255,255,0.5)",
    border10: "rgba(255,255,255,0.10)",
    panel: "rgba(255,255,255,0.05)",
    black20: "rgba(0,0,0,0.2)",
    black30: "rgba(0,0,0,0.3)",
  };

  const authed = isAuthed();

  // Layout responsivo
  const ww = useWindowWidth();
  const isNarrow = ww < 560;
  const posW = isNarrow ? 56 : 72;
  const votesCh = isNarrow ? 9 : 12;
  const pctCh = isNarrow ? 7 : 9;
  const gridCols = `${posW}px 1fr ${votesCh}ch ${pctCh}ch`;

  // ---- Reloj ----
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad2 = (n) => (n < 10 ? `0${n}` : String(n));
  const diff = Math.abs(nowMs - SHOW_START_UTC_MS);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const bigTime = `${days}d:${pad2(hours)}h:${pad2(minutes)}m:${pad2(seconds)}s`;

  return (
    <div style={{ minHeight: "100vh", color: "#fff", background: `linear-gradient(180deg, var(--brand, ${DEFAULTS.brand}), #070a10)` }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(6px)", background: colors.black20, borderBottom: `1px solid ${colors.border10}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent, #e11d48)" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Casa Alofoke — Tracker no oficial</div>
              <div style={{ fontSize: 12, color: colors.text60 }}>Solo mostramos cifras públicas / fans</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#fff", opacity: 0.85 }}>
              {authed ? "🔓 Admin activo" : "🔒 Ajustes bloqueados"}
            </div>
            <a href={liveCounts.page} target="_blank" rel="noreferrer" style={{ fontSize: 12, padding: "8px 12px", borderRadius: 10, border: `1px solid ${colors.border10}`, color: "#fff", textDecoration: "none" }}>Ver contador externo</a>
            {authed && (<Pill onClick={handleLogout}>Bloquear</Pill>)}
            <Pill onClick={openSettings}>Ajustes</Pill>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
        {/* CLOCK */}
        <div style={{ marginBottom: 24 }}>
          <SectionCard title="Tiempo del show" subtitle={`Desde ${SHOW_START_LABEL}`}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "8px 0" }}>
              <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {bigTime}
              </div>
            </div>
            <div style={{ fontSize: 12, color: colors.text60, textAlign: "center", marginTop: 6 }}>
              {nowMs < SHOW_START_UTC_MS ? "Faltan" : "Transcurridos"} desde el inicio
            </div>
          </SectionCard>
        </div>
        {/* HERO */}
        <div style={{ marginBottom: 24 }}>
          <SectionCard title="En vivo ahora" subtitle="Disfruta el show en vivo">
            <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden", border: `1px solid ${colors.border10}` }}>
              <iframe
                title="YouTube Live"
                src={ytPlayer.embed}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <a href={ytPlayer.page} target="_blank" rel="noreferrer" style={{ fontSize: 12, padding: "8px 12px", borderRadius: 10, border: `1px solid ${colors.border10}`, color: "#fff", textDecoration: "none" }}>Ver en YouTube</a>
              <div style={{ fontSize: 12, color: colors.text60 }}>ID: {ytId}</div>
            </div>
          </SectionCard>
        </div>
        <div style={{ marginBottom: 24 }}>
          <SectionCard title="Seguimiento en vivo" subtitle="Actualiza el ID del live si cambia el stream.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ border: `1px solid ${colors.border10}`, background: colors.black30, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.text60 }}>Espectadores en vivo (YouTube · livecounts.io)</div>
                <div style={{ marginTop: 12 }}>
                  <iframe title="Live viewers" src={liveCounts.embed} width="100%" height="90" style={{ border: 0, width: "100%", height: 90, borderRadius: 12 }} />
                </div>
                <div style={{ fontSize: 11, marginTop: 8, color: colors.text50 }}>Si no carga, abre el contador en el botón de arriba.</div>
              </div>
              <div style={{ border: `1px solid ${colors.border10}`, background: colors.black30, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.text60 }}>Visitas a esta página</div>
                <div style={{ marginTop: 12, fontSize: 40, fontWeight: 700, color: "var(--accent, #e11d48)" }}>{visits == null ? "—" : nf.format(visits)}</div>
                <div style={{ fontSize: 11, marginTop: 8, color: colors.text50 }}>Contador público con CountAPI.</div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Leaderboard */}
        <div style={{ marginBottom: 24 }}>
          <SectionCard title="Tabla de posiciones" subtitle="Quién va primero en los votos (edítalo en Ajustes).">
            {leaders.top && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.text60 }}>Líder actual</div>
                <div style={{ marginTop: 6, fontSize: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                  <span>👑</span>
                  <Avatar name={leaders.top.name} ig={leaders.sorted.find((p) => p.id === leaders.top.id)?.ig} img={leaders.sorted.find((p) => p.id === leaders.top.id)?.img} size={28} />
                  <span>{leaders.top.name}</span>
                  <span style={{ color: colors.text70 }}>· {nf.format(leaders.top.votes)} votos ({pf.format(percent(leaders.top.votes, leaders.total))})</span>
                </div>
                {leaders.ties.length > 1 && <div style={{ fontSize: 12, color: colors.text60 }}>Empate en primer lugar ({leaders.ties.length})</div>}
              </div>
            )}

            <div style={{ marginTop: 16, overflow: "hidden", borderRadius: 12, border: `1px solid ${colors.border10}` }}>
              <div style={{ display: "grid", gridTemplateColumns: gridCols, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.text60, background: colors.black30 }}>
                <div style={{ padding: "12px" }}>Posición</div>
                <div style={{ padding: "12px" }}>Participante</div>
                <div style={{ padding: "12px", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Votos</div>
                <div style={{ padding: "12px", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Porcentaje</div>
              </div>
              {leaders.sorted.length === 0 && (
                <div style={{ padding: 16, color: colors.text60, fontSize: 14 }}>Agrega participantes en Ajustes.</div>
              )}
              {leaders.sorted.map((p, idx) => {
                const isLeader = leaders.ties.includes(p.id);
                return (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "center", background: "rgba(255,255,255,0.02)", borderTop: `1px solid rgba(255,255,255,0.05)` }}>
                    <div style={{ padding: 12, display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                      <div style={{ position: "relative", width: 32, height: 32, marginRight: 8 }}>
                        <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(0,0,0,0.4)", border: `1px solid ${colors.border10}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: isLeader ? "var(--accent, #e11d48)" : "#fff", overflow: "hidden" }}>
                          {idx + 1}
                        </span>
                        {isLeader && <span style={{ position: "absolute", right: -6, top: -10, transform: "rotate(-15deg)" }}>👑</span>}
                      </div>
                    </div>
                    <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar name={p.name} ig={p.ig} img={p.img} size={40} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {(p.ig || p.img) && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {p.ig && (
                              <a href={`https://instagram.com/${p.ig}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: colors.text60, textDecoration: "none" }}>@{p.ig}</a>
                            )}
                            {p.img && (
                              <a href={p.img} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: colors.text50, textDecoration: "none" }}>Ver foto</a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: 12, fontSize: 14, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", color: isLeader ? "var(--accent, #e11d48)" : undefined }}>{nf.format(p.votes)}</div>
                    <div style={{ padding: 12, fontSize: 14, textAlign: "right", color: "rgba(255,255,255,0.8)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{pf.format(percent(p.votes, leaders.total))}</div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: "center", fontSize: 12, color: colors.text50 }}>
          Página no oficial creada por fans. Colores y textos personalizables. © {new Date().getFullYear()}
        </div>
      </div>

      {/* Auth modal */}
      {authOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={() => setAuthOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 380, borderRadius: 16, border: `1px solid ${colors.border10}`, background: DEFAULTS.brand, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Acceso requerido</div>
            <div style={{ fontSize: 12, color: colors.text60, marginTop: 4 }}>Introduce usuario y contraseña para abrir Ajustes.</div>
            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              <label style={{ fontSize: 14 }}>
                <div style={{ color: colors.text70, marginBottom: 6 }}>Usuario</div>
                <input
                  style={{ width: "100%", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border10}`, padding: "8px 12px", outline: "none", color: "#fff" }}
                  placeholder="Usuario"
                  value={authForm.user}
                  onChange={(e) => setAuthForm((f) => ({ ...f, user: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                />
              </label>
              <label style={{ fontSize: 14 }}>
                <div style={{ color: colors.text70, marginBottom: 6 }}>Contraseña</div>
                <input
                  type="password"
                  style={{ width: "100%", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border10}`, padding: "8px 12px", outline: "none", color: "#fff" }}
                  placeholder="Contraseña"
                  value={authForm.pass}
                  onChange={(e) => setAuthForm((f) => ({ ...f, pass: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                />
              </label>
              {authErr && <div style={{ fontSize: 12, color: "#fca5a5" }}>{authErr}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 6 }}>
                <Pill onClick={() => setAuthOpen(false)}>Cancelar</Pill>
                <button onClick={handleLogin} style={{ padding: "8px 12px", borderRadius: 12, border: 0, background: "var(--accent, #e11d48)", color: "#fff" }}>Entrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ajustes modal */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={() => setEditing(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 900, borderRadius: 16, border: `1px solid ${colors.border10}`, background: DEFAULTS.brand, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Ajustes rápidos</div>
            <div style={{ fontSize: 12, color: colors.text60, marginTop: 4 }}>Pon el ID del live y gestiona los participantes con sus votos.</div>

            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              <label style={{ fontSize: 14 }}>
                <div style={{ color: colors.text70, marginBottom: 6 }}>ID de YouTube (video o canal)</div>
                <input
                  style={{ width: "100%", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border10}`, padding: "8px 12px", outline: "none", color: "#fff" }}
                  placeholder="Ej: gOJvu0xYsdo"
                  defaultValue={ytId}
                  onChange={(e) => setTemp((p) => ({ ...p, ytId: e.target.value }))}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 14 }}>
                  <div style={{ color: colors.text70, marginBottom: 6 }}>Color base (brand)</div>
                  <input
                    style={{ width: "100%", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border10}`, padding: "8px 12px", outline: "none", color: "#fff" }}
                    placeholder="#0b0f17"
                    defaultValue={brand}
                    onChange={(e) => setTemp((p) => ({ ...p, brand: e.target.value }))}
                  />
                </label>
                <label style={{ fontSize: 14 }}>
                  <div style={{ color: colors.text70, marginBottom: 6 }}>Color acento</div>
                  <input
                    style={{ width: "100%", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border10}`, padding: "8px 12px", outline: "none", color: "#fff" }}
                    placeholder="#e11d48"
                    defaultValue={accent}
                    onChange={(e) => setTemp((p) => ({ ...p, accent: e.target.value }))}
                  />
                </label>
              </div>

              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Participantes y votos</div>
                  <Pill onClick={() => setTemp((p) => ({ ...p, roster: [...p.roster, { id: cryptoRandom(), name: "", votes: 0, ig: "", img: "" }] }))}>Agregar</Pill>
                </div>
                <div style={{ marginTop: 12, display: "grid", gap: 8, maxHeight: 300, overflow: "auto", paddingRight: 4 }}>
                  {(temp.roster || []).map((r, i) => (
                    <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 180px 220px 120px 44px", gap: 8, alignItems: "center" }}>
                      <input
                        style={{ borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border10}`, padding: "8px 12px", outline: "none", color: "#fff" }}
                        placeholder={`Participante ${i + 1}`}
                        defaultValue={r.name}
                        onChange={(e) => { const name = e.target.value; setTemp((p) => ({ ...p, roster: p.roster.map((x) => (x.id === r.id ? { ...x, name } : x)) })); }}
                      />
                      <input
                        style={{ borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border10}`, padding: "8px 12px", outline: "none", color: "#fff" }}
                        placeholder="usuario de Instagram (sin @)"
                        defaultValue={r.ig || ""}
                        onChange={(e) => { const ig = e.target.value.replace(/@/g, "").trim(); setTemp((p) => ({ ...p, roster: p.roster.map((x) => (x.id === r.id ? { ...x, ig } : x)) })); }}
                      />
                      <input
                        style={{ borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border10}`, padding: "8px 12px", outline: "none", color: "#fff" }}
                        placeholder="URL imagen (opcional)"
                        defaultValue={r.img || ""}
                        onChange={(e) => { const img = e.target.value.trim(); setTemp((p) => ({ ...p, roster: p.roster.map((x) => (x.id === r.id ? { ...x, img } : x)) })); }}
                      />
                      <input
                        type="number"
                        style={{ borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border10}`, padding: "8px 12px", outline: "none", color: "#fff", textAlign: "right" }}
                        placeholder="0"
                        defaultValue={r.votes}
                        onChange={(e) => { const v = Number(e.target.value); setTemp((p) => ({ ...p, roster: p.roster.map((x) => (x.id === r.id ? { ...x, votes: Number.isFinite(v) ? v : 0 } : x)) })); }}
                      />
                      <button onClick={() => setTemp((p) => ({ ...p, roster: p.roster.filter((x) => x.id !== r.id) }))} aria-label="Eliminar" style={{ height: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: `1px solid ${colors.border10}`, background: "transparent", color: "#fff" }}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: colors.text50, marginTop: 8 }}>La foto usa este orden: <span style={{ color: colors.text70 }}>URL imagen</span> → <span style={{ color: colors.text70 }}>Instagram</span> → iniciales.</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 8 }}>
                <Pill onClick={handleLogout}>Cerrar sesión</Pill>
                <div style={{ display: "flex", gap: 8 }}>
                  <Pill onClick={() => setEditing(false)}>Cancelar</Pill>
                  <button onClick={saveConfig} style={{ padding: "8px 12px", borderRadius: 12, border: 0, background: "var(--accent, #e11d48)", color: "#fff" }}>Guardar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AlofokeFanOneTab />
    </ErrorBoundary>
  );
}
