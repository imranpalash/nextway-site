/* Nextway — vanilla JS, no dependencies */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: scrolled state + mobile menu + dropdown */
  var header = doc.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var menuBtn = doc.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
      doc.body.style.overflow = open ? 'hidden' : '';
    });
    doc.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); doc.body.style.overflow = '';
      });
    });
  }
  doc.querySelectorAll('.has-sub').forEach(function (li) {
    var b = li.querySelector('.sub-toggle');
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var o = li.classList.toggle('open'); b.setAttribute('aria-expanded', o);
    });
  });
  doc.addEventListener('click', function () {
    doc.querySelectorAll('.has-sub.open').forEach(function (li) { li.classList.remove('open'); li.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false'); });
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      doc.querySelectorAll('.has-sub.open').forEach(function (li) { li.classList.remove('open'); });
      if (header.classList.contains('open')) menuBtn.click();
    }
  });

  /* Open / closed status (Bangladesh time, UTC+6). Hours: 10:00–19:00, closed Friday */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function status() {
    var d = new Date(Date.now() + 6 * 3600 * 1000); // shift so UTC getters give Dhaka time
    var day = d.getUTCDay(), mins = d.getUTCHours() * 60 + d.getUTCMinutes();
    var openToday = day !== 5;
    if (openToday && mins >= 600 && mins < 1140) return { open: true, text: 'Open now · until 7 pm' };
    if (openToday && mins < 600) return { open: false, text: 'Closed · opens today 10 am' };
    var next = (day + 1) % 7; if (next === 5) next = 6;
    var label = next === (day + 1) % 7 ? 'tomorrow' : DAYS[next];
    return { open: false, text: day === 5 ? 'Closed Fridays · opens Saturday 10 am' : 'Closed · opens ' + label + ' 10 am' };
  }
  var st = status();
  doc.querySelectorAll('[data-status]').forEach(function (el) {
    el.classList.toggle('is-open', st.open);
    var t = el.querySelector('.status-text'); if (t) t.textContent = st.text;
  });

  /* Reveal on scroll */
  var rev = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }

  /* Count-up numbers */
  var counters = doc.querySelectorAll('[data-count]');
  function runCount(el) {
    var end = parseFloat(el.getAttribute('data-count')), suffix = el.getAttribute('data-suffix') || '', prefix = el.getAttribute('data-prefix') || '';
    var t0 = null, dur = 1600;
    function f(ts) {
      if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(end * e) + suffix; if (p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } });
    }, { threshold: .6 });
    counters.forEach(function (c) { co.observe(c); });
  } else counters.forEach(runCount);

  /* Hero map: gentle pointer tilt + pin ↔ arc highlight */
  var stage = doc.querySelector('.map-stage');
  if (stage && !reduce && window.matchMedia('(hover:hover)').matches) {
    var tilt = stage.querySelector('.map-tilt'), raf = 0;
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { tilt.style.transform = 'translate(' + (x * -14).toFixed(1) + 'px,' + (y * -9).toFixed(1) + 'px)'; });
    });
    stage.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
  }
  doc.querySelectorAll('.pin').forEach(function (p) {
    var arc = doc.getElementById('arc-' + p.getAttribute('data-code'));
    p.addEventListener('mouseenter', function () { if (arc) arc.classList.add('hl'); });
    p.addEventListener('mouseleave', function () { if (arc) arc.classList.remove('hl'); });
  });

  /* Testimonials controls */
  var track = doc.querySelector('.t-track');
  if (track) {
    var step = function () { var c = track.querySelector('.quote'); return c ? c.offsetWidth + 20 : 340; };
    var prev = doc.querySelector('.t-ctrl .prev'), next = doc.querySelector('.t-ctrl .next');
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  }

  /* Contact form (progressive enhancement; falls back to normal POST) */
  var form = doc.getElementById('contact-form');
  if (form && window.fetch) {
    var msg = doc.getElementById('form-msg'), btn = form.querySelector('button[type=submit]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      btn.disabled = true; var label = btn.innerHTML; btn.textContent = 'Sending…';
      msg.className = 'form-msg'; msg.textContent = '';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.ok) { msg.className = 'form-msg ok'; msg.textContent = j.message || 'Thank you! We have received your message and will reply shortly.'; form.reset(); }
          else { msg.className = 'form-msg err'; msg.textContent = j.message || 'Sorry, something went wrong. Please call or WhatsApp us instead.'; }
        })
        .catch(function () { msg.className = 'form-msg err'; msg.textContent = 'We could not send your message. Please call or WhatsApp us on +880 1614 109215.'; })
        .then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  }
  if (location.search.indexOf('sent=1') > -1) {
    var m = doc.getElementById('form-msg'); if (m) { m.className = 'form-msg ok'; m.textContent = 'Thank you! We have received your message and will reply shortly.'; }
  }


  /* Destinations map <-> flag chips */
  var dsvg = doc.querySelector('.dest-svg');
  if (dsvg) {
    var pick = doc.querySelector('.dest-pick'), hint = pick.querySelector('.dp-hint'), selBox = pick.querySelector('.dp-sel'), plink = pick.querySelector('.dp-link');
    var selected = null;
    var chips = function (code) { return doc.querySelectorAll('.dest-groups .flag[data-code="' + code + '"]'); };
    var grp = function (code) { return dsvg.querySelector('.dc[data-code="' + code + '"]'); };
    var tipOf = function (code) { return dsvg.querySelector('.tip[data-code="' + code + '"]'); };
    var refresh = function (code) {
      var g = grp(code), t = tipOf(code);
      if (t) t.classList.toggle('on', !!g && (g.classList.contains('on') || g.classList.contains('sel')));
    };
    var flip = function (code, cls, on) {
      var g = grp(code); if (g) g.classList.toggle(cls, on);
      chips(code).forEach(function (c) { c.classList.toggle(cls, on); });
      refresh(code);
    };
    var select = function (code) {
      if (selected) flip(selected, 'sel', false);
      selected = code; flip(code, 'sel', true);
      var g = grp(code), name = g ? g.getAttribute('data-name') : code;
      hint.hidden = true; selBox.hidden = false;
      selBox.querySelector('img').src = '/assets/flags/' + code + '.svg';
      selBox.querySelector('b').textContent = name;
      plink.hidden = false; plink.firstChild.nodeValue = 'Ask about ' + name + ' ';
      plink.href = '/contact/?country=' + encodeURIComponent(name) + '#contact-form';
    };
    doc.querySelectorAll('.dest-svg .dc, .dest-groups .flag[data-code]').forEach(function (el) {
      var code = el.getAttribute('data-code');
      el.addEventListener('mouseenter', function () { flip(code, 'on', true); });
      el.addEventListener('mouseleave', function () { flip(code, 'on', false); });
      el.addEventListener('focus', function () { flip(code, 'on', true); });
      el.addEventListener('blur', function () { flip(code, 'on', false); });
      el.addEventListener('click', function () { select(code); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(code); } });
    });
  }

  /* Contact page: office map tabs + country prefill */
  var tabs = doc.querySelectorAll('.map-tabs button');
  if (tabs.length) {
    var ifr = doc.getElementById('office-map'), mlink = doc.getElementById('map-link');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('on'); t.setAttribute('aria-selected', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-selected', 'true');
        ifr.src = b.getAttribute('data-src'); mlink.href = b.getAttribute('data-maps');
      });
    });
  }
  var cm = location.search.match(/[?&]country=([^&]+)/), cf = doc.getElementById('f-country');
  if (cm && cf) cf.value = decodeURIComponent(cm[1].replace(/\+/g, ' '));

  /* Phones: footer offices start collapsed */
  var fo = doc.querySelector('.foot-offices');
  if (fo && window.matchMedia('(max-width:640px)').matches) fo.removeAttribute('open');

  /* Scroll progress bar */
  var bar = doc.createElement('div'); bar.className = 'scroll-bar'; bar.setAttribute('aria-hidden', 'true'); doc.body.appendChild(bar);
  var ticking = false;
  function prog() {
    var h = doc.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ')'; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(prog); } }, { passive: true });
  prog();

  /* Hero map: sweep a highlight along the routes so the map stays alive (also on touch screens) */
  var allArcs = doc.querySelectorAll('.map-overlay .arc');
  if (allArcs.length && !reduce) {
    var ai = 0, last = null;
    setTimeout(function () {
      setInterval(function () {
        if (last) last.classList.remove('hl');
        last = allArcs[ai % allArcs.length]; last.classList.add('hl'); ai++;
      }, 1300);
    }, 4200);
  }

  var y = doc.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
