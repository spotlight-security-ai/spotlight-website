/* Close control for the Pipedrive LeadBooster chat bubble.
   Pipedrive's loader injects the bubble with no way to dismiss it. This adds a
   small X beside the collapsed bubble; tapping it hides the widget for the rest
   of the browsing session (sessionStorage), so it is back on the next visit. */
(function () {
  var KEY = "spotlight-chat-closed";
  var closed = false;
  try { closed = sessionStorage.getItem(KEY) === "1"; } catch (e) {}

  var widget = null, btn = null, timer = null;

  function findWidget() {
    var c = document.getElementById("LeadboosterContainer");
    if (c) return c;
    /* Fallback if Pipedrive renames the container: walk up from their iframe to
       the fixed-position wrapper. */
    var f = document.querySelector('iframe[src*="leadbooster-chat.pipedrive.com"]');
    if (!f) return null;
    var el = f.parentElement;
    while (el && el !== document.body) {
      if (getComputedStyle(el).position === "fixed") return el;
      el = el.parentElement;
    }
    return f.parentElement || f;
  }

  function hide() {
    closed = true;
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    if (widget) widget.style.setProperty("display", "none", "important");
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
    btn = null;
    if (timer) clearInterval(timer);
  }

  function position() {
    if (!widget || !btn) return;
    var r = widget.getBoundingClientRect();
    /* Show only beside the collapsed bubble (or bubble plus a short prompt).
       The open chat window has its own minimise control. */
    var collapsed = r.width > 0 && r.height > 0 && r.height < 200;
    btn.style.display = collapsed ? "" : "none";
    if (collapsed) {
      btn.style.top = Math.max(0, r.top - 10) + "px";
      btn.style.left = Math.max(0, r.right - 14) + "px";
    }
  }

  function attach() {
    widget = findWidget();
    if (!widget) return false;
    if (closed) { widget.style.setProperty("display", "none", "important"); return true; }
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chat-close";
    btn.setAttribute("aria-label", "Close chat");
    btn.title = "Close chat";
    btn.innerHTML = "&times;";
    btn.addEventListener("click", hide);
    document.body.appendChild(btn);
    position();
    timer = setInterval(position, 500);
    window.addEventListener("resize", position);
    return true;
  }

  function start() {
    if (attach()) return;
    if (!window.MutationObserver) return;
    var mo = new MutationObserver(function () { if (attach()) mo.disconnect(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 90000);
  }

  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
