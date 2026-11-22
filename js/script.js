/* ============================================================
   DREAM SCOOPS — interaction layer
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var money = function (n) { return "₱" + Number(n).toLocaleString("en-PH"); };
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Loading screen ---------- */
  var loader = $("#loader");
  var loaderDone = false;
  function hideLoader() {
    if (loaderDone || !loader) return;
    loaderDone = true;
    loader.classList.add("is-hidden");
    loader.setAttribute("aria-hidden", "true");
    setTimeout(function () { if (loader) loader.remove(); }, reduceMotion ? 0 : 700);
  }
  window.addEventListener("load", function () { setTimeout(hideLoader, 450); });
  // Never let a stalled asset trap the visitor on the splash.
  setTimeout(hideLoader, 4000);
  if (document.readyState === "complete") hideLoader();

  /* ---------- Navigation ---------- */
  var navWrap = $("#navWrap");
  var navToggle = $("#navToggle");
  var navLinks = $("#navLinks");

  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  $$(".nav__link").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Scroll: sticky shadow, back to top, active link ---------- */
  var toTop = $("#toTop");
  var sections = $$("main section[id]");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    navWrap.classList.toggle("is-stuck", y > 8);
    var showTop = y > 420;
    toTop.hidden = !showTop;
    toTop.classList.toggle("is-visible", showTop);

    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= 140) current = sections[i];
    }
    $$(".nav__link").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + current.id);
    });
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    $(".brand").focus();
  });

  /* ---------- Reveal on scroll ---------- */
  var revealables = $$("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Toast ---------- */
  var toast = $("#toast");
  var toastTimer;
  function say(message) {
    toast.textContent = message;
    toast.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-show"); }, 2600);
  }

  /* ---------- Cart store ---------- */
  var STORE_KEY = "dream-scoops-cart";
  var cart = [];

  function readCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      return Array.isArray(raw) ? raw.filter(function (l) { return l && l.id && l.price > 0; }) : [];
    } catch (e) { return []; }
  }
  function writeCart() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ }
  }
  cart = readCart();

  /* ---------- Product lookup (from the markup) ---------- */
  var products = $$("#productGrid .card").map(function (card) {
    return {
      id: card.dataset.id,
      name: card.dataset.name,
      img: card.dataset.img,
      price: Number(card.dataset.price),
      desc: card.dataset.desc,
      tag: $(".card__tag", card).textContent.trim(),
      alt: $("img", card).alt
    };
  });
  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });

  var sundae = {
    id: "sundae",
    name: "Dream Sundae Supreme",
    img: "img/sundae.jpg",
    price: 249,
    desc: "Two scoops of your choosing with warm cocoa, whipped cream, sprinkles and a fresh strawberry.",
    tag: "Signature build",
    alt: "Dream Sundae Supreme in a tall glass with strawberry and blueberry scoops, whipped cream and sprinkles"
  };
  byId[sundae.id] = sundae;

  /* ---------- Empty cart artwork ---------- */
  var EMPTY_ART = [
    '<svg class="cart-empty__art" viewBox="0 0 200 220" role="img" aria-label="Illustration of an empty ice cream cone">',
    '<defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0" stop-color="#F2A0C4"/><stop offset="1" stop-color="#C9B8F0"/></linearGradient></defs>',
    '<circle cx="100" cy="96" r="78" fill="#3A2552"/>',
    '<path d="M62 104 L100 206 L138 104 Z" fill="#E8B876"/>',
    '<path d="M70 118 L130 118 M74 134 L126 134 M80 152 L120 152 M86 170 L114 170" stroke="#D19A55" stroke-width="3" stroke-linecap="round" fill="none"/>',
    '<path d="M62 104 L138 104 L100 206 Z" fill="none" stroke="#D19A55" stroke-width="3" stroke-linejoin="round"/>',
    '<path d="M62 104 q0-22 20-24 q4-20 26-20 q24 0 26 20 q20 4 20 24 q-14 12 -30 6 q-16 12 -32 0 q-16 6 -30 -6Z" fill="url(#cg)"/>',
    '<circle cx="80" cy="70" r="5" fill="#FFF2F7"/><circle cx="122" cy="66" r="4" fill="#FFF2F7"/>',
    '<path d="M158 40 l4 11 11 4 -11 4 -4 11 -4-11 -11-4 11-4Z" fill="#A58CE0"/>',
    "</svg>"
  ].join("");

  /* ---------- Cart rendering ---------- */
  var cartBody = $("#cartBody");
  var cartFoot = $("#cartFoot");
  var cartCount = $("#cartCount");
  var cartCountRead = $("#cartCountRead");
  var cartSubtotal = $("#cartSubtotal");

  var wasEmpty = null;
  function renderCart() {
    var units = cart.reduce(function (n, l) { return n + l.qty; }, 0);
    cartCount.textContent = String(units);
    cartCountRead.textContent = units + (units === 1 ? " item" : " items") + " in your cart";

    var isEmpty = !cart.length;
    if (isEmpty !== wasEmpty) cartBody.scrollTop = 0;
    wasEmpty = isEmpty;

    if (isEmpty) {
      cartFoot.hidden = true;
      cartBody.innerHTML = [
        '<div class="cart-empty">',
        EMPTY_ART,
        "<h3>YOUR SCOOP BAG IS EMPTY!</h3>",
        "<p>Something sweet is waiting for you.</p>",
        '<button class="btn btn--primary" type="button" data-action="explore">EXPLORE FLAVORS</button>',
        "</div>"
      ].join("");
      return;
    }

    cartFoot.hidden = false;
    cartBody.innerHTML = cart.map(function (line) {
      return [
        '<div class="line" data-line="' + line.id + '">',
        '<img src="' + line.img + '" alt="' + line.alt + '" width="74" height="74" loading="lazy">',
        '<div><p class="line__name">' + line.name + '</p><p class="line__unit">' + money(line.price) + ' each</p>',
        '<div class="qty qty--sm" role="group" aria-label="Quantity for ' + line.name + '">',
        '<button type="button" data-action="dec" aria-label="Decrease ' + line.name + ' quantity">−</button>',
        '<input type="number" min="1" max="20" value="' + line.qty + '" data-action="qty" aria-label="Quantity for ' + line.name + '">',
        '<button type="button" data-action="inc" aria-label="Increase ' + line.name + ' quantity">+</button>',
        "</div></div>",
        '<div class="line__right">',
        '<span class="line__total">' + money(line.price * line.qty) + "</span>",
        '<button class="line__remove" type="button" data-action="remove" aria-label="Remove ' + line.name + ' from cart">Remove</button>',
        "</div></div>"
      ].join("");
    }).join("");

    cartSubtotal.textContent = money(cart.reduce(function (n, l) { return n + l.price * l.qty; }, 0));
  }

  function addItem(item, qty) {
    qty = Math.max(1, Math.min(20, qty || 1));
    var existing = null;
    for (var i = 0; i < cart.length; i++) { if (cart[i].id === item.id) existing = cart[i]; }
    if (existing) existing.qty = Math.min(20, existing.qty + qty);
    else cart.push({ id: item.id, name: item.name, img: item.img, alt: item.alt, price: item.price, qty: qty });
    writeCart();
    renderCart();
    $("#cartBtn").classList.add("is-bump");
    setTimeout(function () { $("#cartBtn").classList.remove("is-bump"); }, 450);
    say(item.name + " added to your scoop bag.");
  }

  cartBody.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.dataset.action;

    if (action === "explore") {
      closeDialog();
      $("#flavors").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      return;
    }

    var line = btn.closest("[data-line]");
    if (!line) return;
    var item = null;
    for (var i = 0; i < cart.length; i++) { if (cart[i].id === line.dataset.line) item = cart[i]; }
    if (!item) return;

    if (action === "inc") item.qty = Math.min(20, item.qty + 1);
    else if (action === "dec") item.qty -= 1;
    else if (action === "remove") item.qty = 0;
    cart = cart.filter(function (l) { return l.qty > 0; });

    writeCart();
    renderCart();
  });

  cartBody.addEventListener("change", function (e) {
    var input = e.target.closest('input[data-action="qty"]');
    if (!input) return;
    var line = input.closest("[data-line]");
    cart.forEach(function (l) { if (l.id === line.dataset.line) l.qty = Math.max(1, Math.min(20, parseInt(input.value, 10) || 1)); });
    writeCart();
    renderCart();
  });

  /* ---------- Product card buttons ---------- */
  $("#productGrid").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var card = btn.closest(".card");
    var item = byId[card.dataset.id];
    if (!item) return;
    if (btn.dataset.action === "add") addItem(item, 1);
    if (btn.dataset.action === "quickview") openQuickView(item, btn);
  });

  $("#sundaeAdd").addEventListener("click", function () { addItem(sundae, 1); });

  /* ---------- Overlay + dialog plumbing ---------- */
  var overlay = $("#overlay");
  var cartPanel = $("#cartPanel");
  var modal = $("#quickView");
  var lastFocused = null;
  var openName = null;

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function focusables(root) {
    return $$(FOCUSABLE, root).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }

  function trap(e, root) {
    if (e.key !== "Tab") return;
    var list = focusables(root);
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function lockScroll(on) { document.body.classList.toggle("is-locked", on); }

  // One dialog owns the overlay at a time, so closing can never leak the scroll lock.
  function openDialog(panel, name, sourceEl, focusTarget) {
    if (openName) closeDialog();
    openName = name;
    lastFocused = sourceEl || document.activeElement;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-open");
    lockScroll(true);
    setTimeout(function () { if (focusTarget) focusTarget.focus(); }, 60);
  }

  function closeDialog() {
    if (!openName) return;
    var panel = openName === "cart" ? cartPanel : modal;
    panel.classList.remove("is-open");
    openName = null;
    overlay.classList.remove("is-open");
    lockScroll(false);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    lastFocused = null;
    // Hide from assistive tech only after focus has escaped the panel.
    panel.setAttribute("aria-hidden", "true");
  }

  function openCart(trigger) {
    if (openName === "cart") return;
    openDialog(cartPanel, "cart", trigger || $("#cartBtn"), $(".icon-btn", cartPanel));
  }

  function openQuickView(item, sourceEl) {
    $("#qvImg").src = item.img;
    $("#qvImg").alt = item.alt;
    $("#qvName").textContent = item.name;
    $("#qvTag").textContent = item.tag;
    $("#qvDesc").textContent = item.desc;
    $("#qvPrice").textContent = money(item.price);
    $("#qvQty").value = "1";
    modal.dataset.current = item.id;
    openDialog(modal, "quickview", sourceEl, $(".modal__close"));
  }

  $("#cartBtn").addEventListener("click", function () { openCart(); });
  overlay.addEventListener("click", closeDialog);

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeDialog();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeDialog(); return; }
    if (e.key !== "Tab") return;
    if (openName === "cart") trap(e, cartPanel);
    if (openName === "quickview") trap(e, modal);
  });

  /* ---------- Quick view quantity + add ---------- */
  function qvQty() { return Math.max(1, Math.min(20, parseInt($("#qvQty").value, 10) || 1)); }
  modal.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var input = $("#qvQty");
    if (btn.dataset.action === "qv-plus") input.value = String(Math.min(20, qvQty() + 1));
    if (btn.dataset.action === "qv-minus") input.value = String(Math.max(1, qvQty() - 1));
  });
  $("#qvAdd").addEventListener("click", function () {
    var item = byId[modal.dataset.current];
    if (!item) return;
    addItem(item, qvQty());
    openCart($("#cartBtn"));
  });

  /* ---------- Checkout + clear ---------- */
  $("#checkoutBtn").addEventListener("click", function () {
    var total = cart.reduce(function (n, l) { return n + l.price * l.qty; }, 0);
    $("#cartStatus").textContent = "Scoop bag ready — " + money(total) + ". We will confirm your order by phone.";
    say("Thank you! Your order is noted.");
  });
  $("#clearCartBtn").addEventListener("click", function () {
    cart = [];
    writeCart();
    renderCart();
    $("#cartStatus").textContent = "";
    say("Your scoop bag is empty.");
  });

  /* ---------- Contact form ---------- */
  var form = $("#contactForm");
  var rules = [
    { input: "#cName", error: "#cNameErr", test: function (v) { return v.trim().length >= 2; } },
    { input: "#cEmail", error: "#cEmailErr", test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
    { input: "#cMsg", error: "#cMsgErr", test: function (v) { return v.trim().length >= 10; } }
  ];

  rules.forEach(function (rule) {
    var el = $(rule.input);
    el.addEventListener("input", function () {
      if (el.getAttribute("aria-invalid") === "true" && rule.test(el.value)) {
        el.removeAttribute("aria-invalid");
        el.closest(".field").classList.remove("has-error");
        $(rule.error).hidden = true;
      }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstBad = null;
    rules.forEach(function (rule) {
      var el = $(rule.input);
      var ok = rule.test(el.value);
      el.closest(".field").classList.toggle("has-error", !ok);
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      $(rule.error).hidden = ok;
      if (!ok && !firstBad) firstBad = el;
    });
    if (firstBad) { firstBad.focus(); $("#formStatus").textContent = ""; say("Please check the highlighted fields."); return; }
    $("#formStatus").textContent = "Thanks " + $("#cName").value.trim().split(" ")[0] + " — your note is on its way to @jenifer.";
    form.reset();
    say("Message sent. We reply the same day.");
  });

  /* ---------- Init ---------- */
  renderCart();
})();
