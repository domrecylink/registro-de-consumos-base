// Shared UI primitives — icons come from icons.jsx (loaded before this)

// ---- Button ----
const Btn = ({ children, kind, size, icon, iconRight, onClick, disabled, style, type = "button", title }) => (
  <button
    type={type}
    className={"prt-btn" + (kind ? " " + kind : "") + (size ? " " + size : "") + (disabled ? " disabled" : "")}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={style}
    title={title}
  >
    {icon && <Icon name={icon} />}
    {children}
    {iconRight && <Icon name={iconRight} />}
  </button>
);

// ---- Field wrapper ----
const Field = ({ label, required, helper, helperKind, error, children, style }) => (
  <div className="prt-field" style={style}>
    {label && <label className="prt-label">{label}{required && <span className="req">*</span>}</label>}
    {children}
    {(error || helper) && (
      <div className={"prt-help" + (error ? " error" : helperKind ? " " + helperKind : "")}>
        {error && <Icon name="error" size={14} />}
        <span>{error || helper}</span>
      </div>
    )}
  </div>
);

// ---- Input ----
const Input = React.forwardRef(({ value, onChange, placeholder, suffix, error, type = "text", autoFocus, onBlur, onKeyDown, style, min, max }, ref) => {
  return (
    <div className={"prt-input-wrap" + (suffix ? " has-suffix" : "")}>
      <input
        ref={ref}
        type={type}
        className={"prt-input" + (error ? " error" : "")}
        value={value || ""}
        onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        style={style}
        min={min}
        max={max}
      />
      {suffix && <span className="prt-suffix">{suffix}</span>}
    </div>
  );
});

// ---- NumericInput ----
// Input numérico para cantidad/costo en formato chileno:
//   - Bloquea la tecla "." (los puntos los pone el componente).
//   - Acepta una coma como separador decimal.
//   - Mientras el usuario escribe, no formatea (evita saltos de cursor).
//   - Al perder foco, normaliza el valor y lo emite como NÚMERO (no string).
//   - Display sin foco: thousand separator "." + decimal ",".
// Props: value (number | "" | string), onChange(number | ""), placeholder,
//        suffix, error, autoFocus, onBlur, allowDecimal (default true).
const NumericInput = React.forwardRef(({ value, onChange, placeholder, suffix, error, autoFocus, onBlur, style, allowDecimal = true }, ref) => {
  const [focused, setFocused] = React.useState(false);
  const [raw, setRaw] = React.useState("");

  // Format a numeric value to "1.234,56" — sin foco.
  const formatDisplay = (n) => {
    if (n === "" || n == null) return "";
    const num = typeof n === "number" ? n : parseFloat(String(n).replace(/\./g, "").replace(",", "."));
    if (isNaN(num)) return "";
    return num.toLocaleString("es-CL", { maximumFractionDigits: 6 });
  };
  // Parse user-typed "1234,5" → 1234.5
  const parseUserInput = (s) => {
    if (s == null) return "";
    const t = String(s).trim();
    if (!t || t === "-" || t === ",") return "";
    const cleaned = t.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? "" : n;
  };

  const display = focused ? raw : formatDisplay(value);

  const onChangeRaw = (e) => {
    let v = e.target.value;
    // Strip puntos (el usuario no debe escribirlos).
    v = v.replace(/\./g, "");
    // Filtra a dígitos, coma y signo menos.
    v = allowDecimal ? v.replace(/[^0-9,-]/g, "") : v.replace(/[^0-9-]/g, "");
    // Solo una coma.
    const firstComma = v.indexOf(",");
    if (firstComma !== -1) v = v.slice(0, firstComma + 1) + v.slice(firstComma + 1).replace(/,/g, "");
    // Solo un signo menos al inicio.
    if (v.indexOf("-") > 0) v = v.replace(/-/g, "");
    setRaw(v);
    onChange && onChange(parseUserInput(v));
  };
  const onKeyDownGuard = (e) => {
    if (e.key === ".") { e.preventDefault(); return; }
    // Bloquea coma cuando no se permite decimal.
    if (!allowDecimal && e.key === ",") { e.preventDefault(); return; }
  };
  const handleFocus = () => {
    setFocused(true);
    if (value === "" || value == null) { setRaw(""); return; }
    const num = typeof value === "number" ? value : parseFloat(String(value).replace(/\./g, "").replace(",", "."));
    setRaw(isNaN(num) ? "" : String(num).replace(".", ","));
  };
  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={"prt-input-wrap" + (suffix ? " has-suffix" : "")}>
      <input
        ref={ref}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        className={"prt-input" + (error ? " error" : "")}
        value={display}
        onChange={onChangeRaw}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={onKeyDownGuard}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={style}
      />
      {suffix && <span className="prt-suffix">{suffix}</span>}
    </div>
  );
});

// ---- IconSelect ----
// Dropdown custom: trigger estilizado como prt-select + menu propio. Cada
// option puede llevar { value, label, icon, iconBg, iconColor }. Seleccionada
// resalta con fondo primary-50 + texto primary-900 (azul suave). Hover sutil.
// Cierra al click afuera y al Esc.
const IconSelect = ({ value, onChange, options, placeholder, error }) => {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const sel = (options || []).find(o => o.value === value) || null;

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={"prt-select" + (error ? " error" : "")}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          textAlign: "left", cursor: "pointer", paddingRight: 40,
        }}
        aria-expanded={open}
      >
        {sel ? (
          <>
            {sel.icon && (
              <span style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: sel.iconBg || "var(--rl-gray-100)",
                color: sel.iconColor || "var(--rl-gray-700)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}><Icon name={sel.icon} size={15} /></span>
            )}
            <span style={{ flex: 1, color: "var(--rl-gray-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sel.label}</span>
          </>
        ) : (
          <span style={{ flex: 1, color: "var(--rl-gray-400)", font: "400 14px/1 var(--rl-font-body)" }}>
            {placeholder || "Seleccionar…"}
          </span>
        )}
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 30,
            background: "#fff", border: "1px solid var(--rl-gray-200)", borderRadius: 10,
            boxShadow: "0 12px 28px rgba(16,24,40,0.10)",
            padding: 6, maxHeight: 320, overflowY: "auto",
          }}
        >
          {(options || []).map(o => {
            const isSel = o.value === value;
            return (
              <button
                type="button"
                key={o.value}
                role="option"
                aria-selected={isSel}
                onClick={() => { onChange && onChange(o.value); setOpen(false); }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "var(--rl-gray-50)"; }}
                onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                style={{
                  all: "unset", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", boxSizing: "border-box",
                  padding: "9px 10px", marginBottom: 2,
                  borderRadius: 8,
                  background: isSel ? "var(--rl-primary-50)" : "transparent",
                  color: isSel ? "var(--rl-primary-900)" : "var(--rl-gray-800)",
                  font: (isSel ? 600 : 500) + " 13.5px/1 var(--rl-font-body)",
                  transition: "background 90ms",
                }}
              >
                {o.icon && (
                  <span style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    background: o.iconBg || "var(--rl-gray-100)",
                    color: o.iconColor || "var(--rl-gray-700)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}><Icon name={o.icon} size={15} /></span>
                )}
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
                {isSel && <Icon name="check" size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---- DatePicker ----
// Calendario custom dentro de un popover. Trigger estilizado como prt-input.
// value: ISO YYYY-MM-DD o "". max/min: ISO. Día seleccionado: fondo primary-100
// + texto primary-900. Hoy (no seleccionado): borde primary-200 sutil.
// Footer: "Borrar" y "Hoy" como ghost buttons del sistema.
const DatePicker = ({ value, onChange, max, min, error, placeholder }) => {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const today = todayISO();
  const initialMonth = (value && /^\d{4}-\d{2}/.test(value)) ? value.slice(0, 7) : today.slice(0, 7);
  const [viewMonth, setViewMonth] = React.useState(initialMonth);

  React.useEffect(() => {
    if (!open) return;
    if (value && /^\d{4}-\d{2}/.test(value)) setViewMonth(value.slice(0, 7));
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, value]);

  const [vy, vm] = viewMonth.split("-").map(Number);
  const firstOfMonth = new Date(vy, vm - 1, 1);
  const offset = (firstOfMonth.getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(vy, vm, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = firstOfMonth.toLocaleString("es-CL", { month: "long", year: "numeric" });
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const navMonth = (dir) => {
    let ny = vy, nm = vm + dir;
    if (nm < 1) { nm = 12; ny -= 1; }
    if (nm > 12) { nm = 1; ny += 1; }
    setViewMonth(`${ny}-${String(nm).padStart(2, "0")}`);
  };

  const pickDay = (d) => {
    const iso = `${vy}-${String(vm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (max && iso > max) return;
    if (min && iso < min) return;
    onChange && onChange(iso);
    setOpen(false);
  };

  const displayValue = (iso) => {
    if (!iso) return placeholder || "dd/mm/aaaa";
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return iso;
    return `${m[3]}/${m[2]}/${m[1]}`;
  };

  const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
  const todayDisabled = (max && today > max) || (min && today < min);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={"prt-input" + (error ? " error" : "")}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          textAlign: "left", cursor: "pointer",
        }}
      >
        <Icon name="calendar_today" size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
        <span style={{ flex: 1, color: value ? "var(--rl-gray-900)" : "var(--rl-gray-400)", font: value ? "500 14px/1 var(--rl-font-body)" : "400 14px/1 var(--rl-font-body)" }}>
          {displayValue(value)}
        </span>
        <Icon name="expand_more" size={16} style={{ opacity: 0.55, flexShrink: 0 }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30,
            background: "#fff", border: "1px solid var(--rl-gray-200)", borderRadius: 12,
            boxShadow: "0 16px 36px rgba(16,24,40,0.12)",
            padding: 14, width: 304,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button
              type="button" onClick={() => navMonth(-1)}
              style={{ all: "unset", cursor: "pointer", width: 32, height: 32, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--rl-gray-700)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--rl-gray-50)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              aria-label="Mes anterior"
            ><Icon name="chevron_left" size={18} /></button>
            <div style={{ font: "600 14px/1 var(--rl-font-display)", color: "var(--rl-gray-900)" }}>{monthLabel}</div>
            <button
              type="button" onClick={() => navMonth(1)}
              style={{ all: "unset", cursor: "pointer", width: 32, height: 32, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--rl-gray-700)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--rl-gray-50)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              aria-label="Mes siguiente"
            ><Icon name="chevron_right" size={18} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map((w, i) => (
              <div key={i} style={{
                font: "600 11px/1 var(--rl-font-ui)", color: "var(--rl-gray-500)",
                textTransform: "uppercase", letterSpacing: ".04em",
                textAlign: "center", padding: "6px 0",
              }}>{w}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((d, i) => {
              if (d == null) return <div key={i} />;
              const iso = `${vy}-${String(vm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const isToday = iso === today;
              const isSel = iso === value;
              const disabled = (max && iso > max) || (min && iso < min);
              return (
                <button
                  key={i} type="button" disabled={disabled}
                  onClick={() => pickDay(d)}
                  onMouseEnter={(e) => { if (!disabled && !isSel) e.currentTarget.style.background = "var(--rl-gray-50)"; }}
                  onMouseLeave={(e) => { if (!disabled && !isSel) e.currentTarget.style.background = "transparent"; }}
                  aria-pressed={isSel}
                  style={{
                    all: "unset",
                    cursor: disabled ? "not-allowed" : "pointer",
                    width: "100%", aspectRatio: "1 / 1", boxSizing: "border-box",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 8,
                    border: isToday && !isSel ? "1.5px solid var(--rl-primary-300, #7CB3D6)" : "1.5px solid transparent",
                    background: isSel ? "var(--rl-primary-100, #D4E7F4)" : "transparent",
                    color: disabled ? "var(--rl-gray-300)"
                         : isSel ? "var(--rl-primary-900)"
                         : isToday ? "var(--rl-primary-900)"
                         : "var(--rl-gray-800)",
                    font: (isSel ? 700 : 500) + " 13px/1 var(--rl-font-body)",
                    transition: "background 90ms",
                  }}
                >{d}</button>
              );
            })}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--rl-gray-100)",
          }}>
            <Btn size="sm" kind="ghost" onClick={() => { onChange && onChange(""); setOpen(false); }}>Borrar</Btn>
            <Btn size="sm" kind="ghost" disabled={todayDisabled} onClick={() => { onChange && onChange(today); setOpen(false); }}>Hoy</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// Hoy en ISO local (YYYY-MM-DD) y mes actual (YYYY-MM). Para cap de inputs
// date/month que no deben permitir futuro.
function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" +
         String(d.getMonth() + 1).padStart(2, "0") + "-" +
         String(d.getDate()).padStart(2, "0");
}
function currentMonthISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

// ---- Select ----
const Select = ({ value, onChange, options, placeholder, error, style }) => (
  <select
    className={"prt-select" + (error ? " error" : "")}
    value={value || ""}
    onChange={e => onChange && onChange(e.target.value)}
    style={style}
  >
    <option value="" disabled hidden>{placeholder || "Seleccionar…"}</option>
    {options.map(o => {
      if (typeof o === "string") return <option key={o} value={o}>{o}</option>;
      return <option key={o.value} value={o.value}>{o.label}</option>;
    })}
  </select>
);

// ---- Chip ----
const Chip = ({ children, kind, size, icon, dot, onClose }) => (
  <span className={"prt-chip" + (kind ? " " + kind : "") + (size ? " " + size : "")}>
    {dot && <span className="dot"></span>}
    {icon && <Icon name={icon} size={14} />}
    {children}
    {onClose && <button onClick={onClose} style={{ all: "unset", cursor: "pointer", marginLeft: 4, display: "inline-flex" }}><Icon name="close" size={14} /></button>}
  </span>
);

// ---- Type dot ----
const TypeIndicator = ({ type, withLabel }) => {
  const t = TYPES[type];
  if (!t) return null;
  return (
    <span className="prt-row" style={{ gap: 8 }}>
      <span className={"prt-type-dot " + type}><Icon name={t.icon} size={16} /></span>
      {withLabel && <span style={{ font: "600 13px/1 var(--rl-font-display)", color: "var(--rl-gray-800)" }}>{t.label}</span>}
    </span>
  );
};

// ---- Card ----
const Card = ({ children, style, flush, bordered, className }) => (
  <div
    className={"prt-card" + (flush ? " flush" : "") + (bordered ? " bordered" : "") + (className ? " " + className : "")}
    style={style}
  >
    {children}
  </div>
);

// ---- Section heading helper ----
const SectionHead = ({ eyebrow, title, sub, right }) => (
  <div className="prt-spread" style={{ marginBottom: 18 }}>
    <div>
      {eyebrow && <div className="prt-eyebrow">{eyebrow}</div>}
      <h1 className="prt-h1" style={{ marginTop: 4 }}>{title}</h1>
      {sub && <div className="prt-muted" style={{ marginTop: 6, maxWidth: 640 }}>{sub}</div>}
    </div>
    {right && <div className="prt-row">{right}</div>}
  </div>
);

// ---- Steps ----
const Steps = ({ items, current }) => (
  <div className="prt-steps">
    {items.map((it, i) => {
      const isActive = i === current;
      const isDone = i < current;
      const cls = isActive ? "active" : isDone ? "done" : "";
      return (
        <React.Fragment key={i}>
          <span className={"prt-step " + cls}>
            <span className="num">{isDone ? <Icon name="check" size={14} /> : i + 1}</span>
            <span>{it}</span>
          </span>
          {i < items.length - 1 && <span className={"prt-step-sep" + (isDone ? " done" : "")}></span>}
        </React.Fragment>
      );
    })}
  </div>
);

// ---- Empty state ----
const EmptyState = ({ icon = "inbox", title, body, actions }) => (
  <div className="prt-empty">
    <div className="icon-circle"><Icon name={icon} /></div>
    <div>
      <div className="prt-h2">{title}</div>
      {body && <div className="prt-muted" style={{ marginTop: 6, maxWidth: 460 }}>{body}</div>}
    </div>
    {actions && <div className="prt-row" style={{ marginTop: 4 }}>{actions}</div>}
  </div>
);

// ---- Toast Host ----
const ToastHost = () => {
  const { state, dispatch } = useApp();
  const t = state.toast;
  if (!t) return null;
  const iconMap = { success: "check", error: "close", warning: "warning", info: "info" };
  return (
    <div className="prt-toast-host">
      <div className={"prt-toast " + t.kind} role="status">
        <span className="ico"><Icon name={iconMap[t.kind] || "info"} size={18} /></span>
        <div className="prt-grow">
          <div className="title">{t.title}</div>
          {t.body && <div className="body">{t.body}</div>}
          {t.undoAction && (
            <div className="actions">
              <button className="undo" onClick={() => { t.undoAction(); dispatch({ type: "TOAST/HIDE" }); }}>
                Deshacer
              </button>
            </div>
          )}
        </div>
        <button className="close" onClick={() => dispatch({ type: "TOAST/HIDE" })}>
          <Icon name="close" size={18} />
        </button>
      </div>
    </div>
  );
};

Object.assign(window, {
  Btn, Field, Input, NumericInput, Select, IconSelect, DatePicker, Chip, TypeIndicator,
  Card, SectionHead, Steps, EmptyState, ToastHost,
  todayISO, currentMonthISO,
});
