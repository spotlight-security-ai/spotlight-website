/* Close control for the Pipedrive LeadBooster chat bubble.
   Pipedrive's loader injects the bubble with no way to dismiss it. This adds a
   small X beside the collapsed bubble; tapping it hides the widget for the rest
   of the browsing session (sessionStorage), so it is back on the next visit.
   The widget is found by polling rather than by a single insertion event, since
   Pipedrive inserts its iframe first and fills in its address a moment later. */
(function () {
  var KEY = "spotlight-chat-closed";
  var closed = false;
  try { closed = sessionStorage.getItem(KEY) === "1"; } catch (e) {}

  var widget = null, btn = null;

  function findWidget() {
    var c = document.getElementById("LeadboosterContainer");
    if (c) return c;
    /* Fallback if Pipedrive renames the container: walk up from their iframe to
       the fixed-position wrapper. */
    var f = document.querySelector('iframe[src*="leadbooster-chat.pipedrive.com"], iframe[src*="pipedrive.com/leadbooster"]');
    if (!f) return null;
    var el = f.parentElement;
    while (el && el !== document.body) {
      if (getComputedStyle(el).position === "fixed") return el;
      el = el.parentElement;
    }
    return f.parentElement || f;
  }

  function hideWidget() {
    if (widget) widget.style.setProperty("display", "none", "important");
  }

  function onClose() {
    closed = true;
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    hideWidget();
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
    btn = null;
  }

  function ensureButton() {
    if (btn) return;
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chat-close";
    btn.setAttribute("aria-label", "Close chat");
    btn.title = "Close chat";
    btn.innerHTML = "&times;";
    btn.addEventListener("click", onClose);
    document.body.appendChild(btn);
  }

  function position() {
    if (!widget || !btn) return;
    var r = widget.getBoundingClientRect();
    /* Show beside the collapsed bubble, or the bubble with a short greeting.
       Hide while the full chat window is open; it has its own minimise control. */
    var collapsed = r.width > 0 && r.height > 0 && r.height < 300;
    btn.style.display = collapsed ? "" : "none";
    if (collapsed) {
      btn.style.top = Math.max(0, r.top - 10) + "px";
      btn.style.left = Math.max(0, r.right - 14) + "px";
    }
  }

  /* Runs every 400ms: finds the widget (again, if Pipedrive rebuilt it), keeps
     it hidden once closed, and keeps the X beside the bubble. */
  function tick() {
    if (!widget || !document.documentElement.contains(widget)) {
      widget = findWidget();
      if (widget && closed) hideWidget();
    }
    if (!widget) return;
    if (closed) { hideWidget(); return; }
    ensureButton();
    position();
  }

  function start() {
    tick();
    setInterval(tick, 400);
    window.addEventListener("resize", position);
  }

  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
