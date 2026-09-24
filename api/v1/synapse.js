(function (w, d) {
  "use strict";
  if (w.Synapse && w.Synapse.version) return;

  var cs = d.currentScript;
  var ds = (cs && cs.dataset) || {};

  function deriveBase() {
    if (ds.base) return ds.base.replace(/\/+$/, "");
    try { return new URL("../../", cs.src).href.replace(/\/+$/, ""); } catch (e) { return ""; }
  }

  var cfg = {
    base: deriveBase(),
    entry: "index.html",
    mode: ds.mode || "button",
    target: ds.target || "#synapse",
    label: ds.label || "Play",
    position: ds.position || "bottom-right",
    height: ds.height || "600px",
    guest: ds.guest !== "false",
    allow: "fullscreen; autoplay; gamepad; microphone; clipboard-write; clipboard-read"
  };

  var listeners = {}, overlay = null, btn = null, mounted = [];

  function emit(name, data) {
    (listeners[name] || []).slice().forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } });
  }

  function url(params) {
    var u = cfg.base + "/" + cfg.entry;
    var q = [];
    if (!cfg.guest) q.push("guest=0");
    for (var k in (params || {})) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
    return q.length ? u + "?" + q.join("&") : u;
  }

  function frame(opts) {
    var f = d.createElement("iframe");
    f.src = url(opts && opts.params);
    f.title = "Synapse";
    f.setAttribute("allow", cfg.allow);
    f.setAttribute("allowfullscreen", "");
    f.style.cssText = "border:0;width:100%;height:100%;display:block;background:#000";
    f.addEventListener("load", function () { emit("ready", f); });
    return f;
  }

  function mount(target, opts) {
    var el = typeof target === "string" ? d.querySelector(target) : target;
    if (!el) { console.warn("[Synapse] mount target not found:", target); return null; }
    if (!el.style.height && !el.offsetHeight) el.style.height = cfg.height;
    var f = frame(opts);
    el.appendChild(f);
    mounted.push(f);
    return f;
  }

  function open(opts) {
    if (overlay) return overlay;
    overlay = d.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:#000";
    var x = d.createElement("button");
    x.type = "button";
    x.textContent = "\u00d7";
    x.setAttribute("aria-label", "Close");
    x.style.cssText = "position:absolute;top:8px;right:8px;z-index:1;width:36px;height:36px;border:0;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;font:24px/1 sans-serif;cursor:pointer";
    x.onclick = close;
    overlay.appendChild(x);
    overlay.appendChild(frame(opts));
    d.body.appendChild(overlay);
    d.addEventListener("keydown", onKey);
    if (btn) btn.style.display = "none";
    emit("open");
    return overlay;
  }

  function onKey(e) { if (e.key === "Escape") close(); }

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    d.removeEventListener("keydown", onKey);
    if (btn) btn.style.display = "";
    emit("close");
  }

  function button() {
    if (btn) return btn;
    btn = d.createElement("button");
    btn.type = "button";
    btn.textContent = cfg.label;
    var side = cfg.position === "bottom-left" ? "left" : "right";
    btn.style.cssText = "position:fixed;bottom:20px;" + side + ":20px;z-index:2147482999;padding:12px 22px;border:0;border-radius:999px;background:#ff8700;color:#fff;font:600 15px sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)";
    btn.onclick = function () { open(); };
    d.body.appendChild(btn);
    return btn;
  }

  function destroy() {
    close();
    if (btn) { btn.remove(); btn = null; }
    mounted.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    mounted = [];
  }

  function init() {
    if (cfg.mode === "inline") mount(cfg.target);
    else if (cfg.mode === "button") button();
  }

  w.Synapse = {
    version: "1.0.0",
    config: function (o) { for (var k in o) cfg[k] = o[k]; return cfg; },
    mount: mount, open: open, close: close, destroy: destroy,
    url: url,
    on: function (n, fn) { (listeners[n] = listeners[n] || []).push(fn); },
    off: function (n, fn) { listeners[n] = (listeners[n] || []).filter(function (f) { return f !== fn; }); }
  };

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);
