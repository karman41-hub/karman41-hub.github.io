/* ============================================================
   KARTHIK MANU — Personal Website
   script.js  |  Interactions & Data Rendering
   ============================================================ */

'use strict';

/* Shared IntersectionObserver for scroll-reveal on dynamic content */
let _revealObserver = null;

/* ── 0. DATA LOADER ─────────────────────────────────────────── */
(async function loadData() {
  let d;
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    d = await res.json();
  } catch (e) {
    console.warn('data.json failed to load:', e.message);
    return;
  }

  /* Stats */
  const statCards = document.getElementById('statCards');
  if (statCards && d.stats) {
    statCards.innerHTML = d.stats.map(s => `
      <div class="stat-card reveal">
        <div class="stat-num">${s.num}</div>
        <div class="stat-label">${s.label}</div>
      </div>`).join('');
    observeNew(statCards);
  }

  /* Citation counts */
  if (d.citations) {
    setText('citationCount', d.citations.total);
    setText('hIndex', d.citations.hIndex);
    setText('i10Index', d.citations.i10Index);
  }

  /* Publications – bubble chart first, then full list */
  if (d.publications) renderBubbleChart(d.publications);

  const pubList = document.getElementById('publicationsList');
  if (pubList && d.publications) {
    pubList.innerHTML = d.publications.map(p => `
      <article class="pub-card reveal">
        <div class="pub-year-col">
          <span class="pub-year">${p.year}</span>
        </div>
        <div class="pub-main">
          <div class="pub-meta-row">
            <span class="pub-type-badge ${p.type.toLowerCase()}">${p.type}</span>
            ${p.citedBy ? `<span class="pub-cited" title="Citations on Google Scholar"><i class="fas fa-quote-right" aria-hidden="true"></i> ${p.citedBy}</span>` : ''}
          </div>
          <h3 class="pub-title">${p.title}</h3>
          <p class="pub-authors">${p.authors}</p>
          <p class="pub-venue">${p.venue}</p>
          <div class="pub-actions">
            ${p.doi !== '#' ? `<a href="${p.doi}" class="pub-link" target="_blank" rel="noopener"><i class="fas fa-external-link-alt" aria-hidden="true"></i> DOI</a>` : ''}
            <a href="${p.scholar}" class="pub-link" target="_blank" rel="noopener"><i class="fas fa-graduation-cap" aria-hidden="true"></i> Scholar</a>
          </div>
        </div>
      </article>`).join('');
    observeNew(pubList);
  }

  /* Projects */
  const projGrid = document.getElementById('projectsGrid');
  if (projGrid && d.projects) {
    projGrid.innerHTML = d.projects.map(p => `
      <article class="project-card reveal" data-category="${p.category}">
        <div class="project-year-col">
          <span class="project-year">${p.year}</span>
        </div>
        <div class="project-main-col">
          <div class="project-header-row">
            <h3 class="project-title">${p.title}</h3>
            <span class="project-tag">${p.tag}</span>
          </div>
          <p class="project-desc">${p.desc}</p>
          <div class="project-outcomes">
            ${p.outcomes.map(o => `
              <div class="outcome">
                <i class="fas ${o.icon}" aria-hidden="true"></i> ${o.text}
              </div>`).join('')}
          </div>
          <div class="project-tech">
            ${p.tech.map(t => `<span>${t}</span>`).join('')}
          </div>
        </div>
      </article>`).join('');
    observeNew(projGrid);
    /* Initialise filter now that cards exist in DOM */
    initProjectFilter();
  }

  /* Blog */
  const blogGrid = document.getElementById('blogGrid');
  if (blogGrid && d.blog) {
    blogGrid.innerHTML = d.blog.map(p => `
      <article class="blog-card reveal">
        <div class="blog-date-col">
          <span class="blog-date">${p.date}</span>
          <div class="blog-icon-wrap" aria-hidden="true">
            <i class="fas ${p.icon}"></i>
          </div>
        </div>
        <div class="blog-main">
          <div class="blog-category">${p.category}</div>
          <h3 class="blog-title">${p.title}</h3>
          <p class="blog-excerpt">${p.excerpt}</p>
          <div class="blog-meta"><i class="far fa-clock" aria-hidden="true"></i> ${p.readTime}</div>
          ${p.link !== '#'
            ? `<a href="${p.link}" class="blog-read-more" target="_blank" rel="noopener">Read Article <i class="fas fa-arrow-right" aria-hidden="true"></i></a>`
            : `<span class="blog-read-more" style="opacity:0.4;cursor:default;" aria-label="Coming soon">Coming Soon</span>`}
        </div>
      </article>`).join('');
    observeNew(blogGrid);
  }
  /* Slideshow */
  initSlideshow(d.slides || []);
})();

/* ── SLIDESHOW ──────────────────────────────────────────────── */
function initSlideshow(slides) {
  const container = document.getElementById('slideshowContainer');
  if (!container) return;

  const wrapper  = container.querySelector('#slidesWrapper');
  const dotsEl   = container.querySelector('#slideDots');
  const prevBtn  = container.querySelector('#slidePrev');
  const nextBtn  = container.querySelector('#slideNext');
  const progFill = container.querySelector('.slideshow-progress-fill');

  if (!slides.length) {
    wrapper.innerHTML = `
      <div class="slide-item active">
        <div class="slide-placeholder">
          <i class="fas fa-images" aria-hidden="true"></i>
          <p>Export your PPT slides as images (File → Export → JPEG)<br>and place them in the <code>assets/slides/</code> folder.</p>
          <p>Then add them to <code>data.json</code> under the <code>"slides"</code> key.</p>
        </div>
      </div>`;
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    return;
  }

  let current = 0;
  let timer   = null;
  const INTERVAL = 5000; /* ms per slide */

  /* Build slides */
  wrapper.innerHTML = slides.map((s, i) => `
    <div class="slide-item${i === 0 ? ' active' : ''}" data-index="${i}">
      <img src="${s.src}" alt="${s.alt || 'Slide ' + (i + 1)}" loading="${i === 0 ? 'eager' : 'lazy'}" />
    </div>`).join('');

  /* Build dots */
  dotsEl.innerHTML = slides.map((_, i) => `
    <button class="slide-dot${i === 0 ? ' active' : ''}" data-dot="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('');

  function goTo(idx) {
    const items = wrapper.querySelectorAll('.slide-item');
    const dots  = dotsEl.querySelectorAll('.slide-dot');
    items[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    items[current].classList.add('active');
    dots[current].classList.add('active');
    restartTimer();
  }

  function restartTimer() {
    if (progFill) {
      progFill.style.transition = 'none';
      progFill.style.width = '0%';
      /* force reflow */
      progFill.offsetWidth; // eslint-disable-line no-unused-expressions
      progFill.style.transition = `width ${INTERVAL}ms linear`;
      progFill.style.width = '100%';
    }
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), INTERVAL);
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  dotsEl.addEventListener('click', e => {
    const dot = e.target.closest('.slide-dot');
    if (dot) goTo(+dot.dataset.dot);
  });

  /* Pause on hover */
  container.addEventListener('mouseenter', () => clearInterval(timer));
  container.addEventListener('mouseleave', restartTimer);

  /* Keyboard */
  container.setAttribute('tabindex', '0');
  container.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  restartTimer();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function observeNew(container) {
  if (!_revealObserver) return;
  container.querySelectorAll('.reveal:not(.visible)').forEach(el => _revealObserver.observe(el));
}


/* ── 1. CURSOR SPOTLIGHT ────────────────────────────────────── */
(function initSpotlight() {
  const spotlight = document.querySelector('.spotlight');
  if (!spotlight) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return; /* skip on touch devices */

  let suppressed = false;

  /* Suppress spotlight over interactive charts / media */
  document.querySelectorAll('.pub-bubble-wrap, .slideshow-container').forEach(el => {
    el.addEventListener('mouseenter', () => {
      suppressed = true;
      spotlight.style.background = 'none';
    }, { passive: true });
    el.addEventListener('mouseleave', () => {
      suppressed = false;
    }, { passive: true });
  });

  document.addEventListener('mousemove', e => {
    if (suppressed) return;
    spotlight.style.background =
      `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(192,57,43,0.16), transparent 40%)`;
  }, { passive: true });
})();


/* ── 2. ACTIVE NAV ON SCROLL ────────────────────────────────── */
(function initActiveNav() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  if (!navLinks.length || !sections.length) return;

  function setActive(id) {
    navLinks.forEach(link =>
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`)
    );
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach(sec => observer.observe(sec));
  if (sections[0]) setActive(sections[0].id);
})();


/* ── 3. SCROLL REVEAL ───────────────────────────────────────── */
(function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  _revealObserver = observer;
})();


/* ── 4. MOBILE MENU ─────────────────────────────────────────── */
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (!hamburger || !mobileNav) return;

  function openMenu() {
    mobileNav.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileNav.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () =>
    mobileNav.classList.contains('open') ? closeMenu() : openMenu()
  );

  document.querySelectorAll('.mobile-nav-link').forEach(link =>
    link.addEventListener('click', closeMenu)
  );

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
})();


/* ── 5. PROJECT FILTER (single instance, called after data loads) */
function initProjectFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      document.querySelectorAll('.project-card').forEach(card => {
        const cats = (card.dataset.category || '').split(' ');
        const show = filter === 'all' || cats.includes(filter);
        card.style.display = show ? '' : 'none';
      });
    });
  });
}


/* ── 6. CONTACT FORM — inline validation, no alert() ───────── */
(function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  function showError(inputId, errId, msg) {
    const field = document.getElementById(inputId);
    const err   = document.getElementById(errId);
    if (field) field.classList.add('error');
    if (err)   err.textContent = msg;
  }

  function clearErrors() {
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();

    const data = Object.fromEntries(new FormData(form).entries());
    let valid = true;

    if (!data.name?.trim()) {
      showError('fname', 'nameError', 'Name is required.');
      valid = false;
    }
    if (!data.email?.trim()) {
      showError('femail', 'emailError', 'Email is required.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      showError('femail', 'emailError', 'Enter a valid email address.');
      valid = false;
    }
    if (!data.message?.trim()) {
      showError('fmessage', 'messageError', 'Message is required.');
      valid = false;
    }
    if (!valid) {
      /* Move focus to the first error field */
      const firstErr = form.querySelector('.error');
      if (firstErr) firstErr.focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Sending…';

    try {
      const payload = {
        name:    data.name,
        email:   data.email,
        subject: data.subject || 'Website Contact',
        message: data.message,
        _subject: `[karman41-hub.github.io] ${data.subject || 'New message'} — from ${data.name}`,
        _captcha: 'false',
        _template: 'table',
      };
      const res = await fetch('https://formsubmit.co/ajax/karthikm4159@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Network error');
      form.style.display = 'none';
      success.style.display = 'block';
    } catch {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i> Send Message';
      showError('fmessage', 'messageError', 'Send failed — email karthikm4159@gmail.com directly.');
    }
  });
})();


/* ── 7. SMOOTH SCROLL ───────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href   = link.getAttribute('href');
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();


/* ── 8. FOOTER YEAR ─────────────────────────────────────────── */
(function setYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();


/* ── 9. CITATION BUBBLE TIMELINE ────────────────────────────── */
function renderBubbleChart(publications) {
  const wrap = document.getElementById('pubBubble');
  if (!wrap) return;

  /* ── Layout ────────────────────────────────────────────────── */
  const W = 900, H = 420;
  const ML = 68, MR = 32, MT = 44, MB = 54;
  const CW = W - ML - MR;   /* 800 */
  const CH = H - MT - MB;   /* 322 */

  /* ── Data ──────────────────────────────────────────────────── */
  const pubs   = publications.filter(p => p.year && !isNaN(+p.year));
  const allYrs = pubs.map(p => +p.year);
  const minYr  = 2020;   /* fixed – x-axis always starts at 2020 */
  const maxYr  = Math.max(...allYrs);
  const ySpan  = maxYr === minYr ? 1 : maxYr - minYr;
  const YCEILING = 100;   /* y-axis top label */

  const xOf = yr  => ML + ((yr - minYr) / ySpan) * CW;
  const yOf = cit => MT + CH - Math.min(cit, YCEILING) / YCEILING * CH;
  const rOf = cit => 7 + Math.sqrt(cit || 0) * 3.9;

  /* ── Colors ────────────────────────────────────────────────── */
  const C = {
    journal:    { s: '#4f46e5', f: 'rgba(79,70,229,0.10)'   },
    conference: { s: '#b45309', f: 'rgba(180,83,9,0.10)'    },
    report:     { s: '#166534', f: 'rgba(22,101,52,0.10)'   },
  };

  /* ── Group by year + sort descending by citations ──────────── */
  const byYr = {};
  pubs.forEach(p => { const y = +p.year; (byYr[y] = byYr[y] || []).push(p); });
  Object.values(byYr).forEach(g => g.sort((a, b) => (b.citedBy || 0) - (a.citedBy || 0)));

  const JITTER = 30;
  const nodes  = [];
  Object.entries(byYr).forEach(([yr, grp]) => {
    const n = grp.length;
    grp.forEach((p, i) => {
      const off = n === 1 ? 0 : (i - (n - 1) / 2) * JITTER;
      nodes.push({ p, cx: xOf(+yr) + off, cy: yOf(p.citedBy || 0), r: rOf(p.citedBy || 0) });
    });
  });

  /* ── SVG builder ───────────────────────────────────────────── */
  const esc = s => (s || '').replace(/"/g, '&quot;').replace(/[<>]/g, '');
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    class="pub-bubble-svg" role="img" aria-label="Citation bubble timeline">`;

  /* grid + y-axis */
  [0, 25, 50, 75, 100].forEach(v => {
    const gy = yOf(v);
    svg += `<line x1="${ML}" y1="${gy}" x2="${W - MR}" y2="${gy}"
      stroke="${v === 0 ? '#ccc' : '#ecdede'}" stroke-width="${v === 0 ? 1.5 : 1}"
      stroke-dasharray="${v === 0 ? 'none' : '5,5'}"/>`;
    svg += `<text x="${ML - 10}" y="${gy + 4}" class="bc-y-lbl">${v}</text>`;
  });

  /* x-axis ticks, labels, faint vertical guides */
  for (let yr = minYr; yr <= maxYr; yr++) {
    const gx = xOf(yr);
    if (yr > minYr && yr < maxYr)
      svg += `<line x1="${gx}" y1="${MT}" x2="${gx}" y2="${MT + CH}"
        stroke="#ede0e0" stroke-width="1" stroke-dasharray="3,6"/>`;
    svg += `<line x1="${gx}" y1="${MT + CH}" x2="${gx}" y2="${MT + CH + 7}" stroke="#bbb" stroke-width="1"/>`;
    svg += `<text x="${gx}" y="${MT + CH + 22}" class="bc-x-lbl">${yr}</text>`;
  }

  /* axis lines */
  svg += `<line x1="${ML}" y1="${MT}" x2="${ML}" y2="${MT + CH + 1}" stroke="#ccc" stroke-width="1.5"/>`;
  svg += `<line x1="${ML - 1}" y1="${MT + CH}" x2="${W - MR}" y2="${MT + CH}" stroke="#ccc" stroke-width="1.5"/>`;

  /* axis titles */
  svg += `<text x="${ML - 48}" y="${MT + CH / 2}" class="bc-axis-title"
    transform="rotate(-90,${ML - 48},${MT + CH / 2})">Citations</text>`;
  svg += `<text x="${ML + CW / 2}" y="${H - 6}" class="bc-axis-title">Year</text>`;

  /* legend – top right */
  const LX = W - MR - 120, LY = MT - 4;
  [['Journal','journal'],['Conference','conference'],['Report','report']].forEach(([lbl, k], i) => {
    const ly = LY + i * 22;
    svg += `<circle cx="${LX + 8}" cy="${ly + 9}" r="7"
      fill="${C[k].f}" stroke="${C[k].s}" stroke-width="2"/>`;
    svg += `<text x="${LX + 22}" y="${ly + 13}" class="bc-legend-lbl" style="fill:${C[k].s}">${lbl}</text>`;
  });

  /* bubbles – largest drawn first so smaller ones sit on top */
  [...nodes].sort((a, b) => b.r - a.r).forEach(({ p, cx, cy, r }) => {
    const k   = p.type.toLowerCase();
    const col = C[k] || C.journal;
    const cit = p.citedBy || 0;
    svg += `<g class="bc-node"
      data-title="${esc(p.title)}"
      data-type="${p.type}"
      data-year="${p.year}"
      data-cit="${cit}"
      data-doi="${p.doi !== '#' ? p.doi : ''}"
      data-scholar="${p.scholar || ''}"
      tabindex="0" role="button"
      aria-label="${p.type} ${p.year}, ${cit} citations: ${esc(p.title)}">`;
    /* glow ring (shown on hover via CSS) */
    svg += `<circle cx="${cx}" cy="${cy}" r="${r + 7}"
      fill="none" stroke="${col.s}" stroke-width="1.5" opacity="0" class="bc-ring"/>`;
    /* main circle */
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}"
      fill="${col.f}" stroke="${col.s}" stroke-width="2" class="bc-circle"/>`;
    /* label inside large bubbles */
    if (cit >= 10)
      svg += `<text x="${cx}" y="${cy + 4}" class="bc-inner-lbl" style="fill:${col.s}">${cit}</text>`;
    svg += `</g>`;
  });

  /* most-cited annotation */
  const top = nodes.reduce((a, b) => ((a.p.citedBy || 0) >= (b.p.citedBy || 0) ? a : b));
  if ((top.p.citedBy || 0) >= 10) {
    const ax = top.cx + top.r + 8;
    const ay = top.cy;
    svg += `<line x1="${top.cx + top.r}" y1="${ay}" x2="${ax + 2}" y2="${ay}"
      stroke="#4f46e5" stroke-width="1" stroke-dasharray="3,3" opacity="0.55"/>`;
    svg += `<text x="${ax + 5}" y="${ay - 4}" class="bc-annot">${top.p.citedBy} citations</text>`;
    svg += `<text x="${ax + 5}" y="${ay + 9}" class="bc-annot-sub">Most cited</text>`;
  }

  svg += `</svg><div class="bc-tooltip" id="bcTooltip"></div>`;
  wrap.innerHTML = svg;

  /* ── Interactivity ─────────────────────────────────────────── */
  const tip = document.getElementById('bcTooltip');

  wrap.querySelectorAll('.bc-node').forEach(node => {
    const show = (cx, cy) => {
      const cit  = +node.dataset.cit;
      const type = node.dataset.type;
      tip.innerHTML = `
        <div class="bc-tip-top">
          <span class="bc-tip-badge ${type.toLowerCase()}">${type}</span>
          <span class="bc-tip-year">${node.dataset.year}</span>
        </div>
        <div class="bc-tip-title">${node.dataset.title}</div>
        ${cit > 0 ? `<div class="bc-tip-cit"><i class="fas fa-quote-right"></i> ${cit} citation${cit !== 1 ? 's' : ''}</div>` : ''}
        <div class="bc-tip-foot">Click to open ↗</div>`;

      const wr = wrap.getBoundingClientRect();
      let tx = cx - wr.left + 14;
      let ty = cy - wr.top  - 10;
      tip.style.display = 'block';
      const tw = 270;
      if (tx + tw > wrap.clientWidth - 6) tx = cx - wr.left - tw - 14;
      if (ty < 4) ty = 4;
      tip.style.left = tx + 'px';
      tip.style.top  = ty + 'px';
    };
    const hide = () => { tip.style.display = 'none'; };

    node.addEventListener('mouseenter', e => show(e.clientX, e.clientY));
    node.addEventListener('mousemove',  e => show(e.clientX, e.clientY));
    node.addEventListener('mouseleave', hide);
    node.addEventListener('focus', () => {
      const cr = node.querySelector('.bc-circle').getBoundingClientRect();
      show(cr.right, cr.top);
    });
    node.addEventListener('blur', hide);
    node.addEventListener('click', () => {
      const url = node.dataset.doi || node.dataset.scholar;
      if (url) window.open(url, '_blank', 'noopener');
    });
    node.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); node.click(); }
    });
  });
}


/* ── 10. LULEÅ LIVE CLOCK (Europe/Stockholm = CET/CEST) ─────── */
(function initClock() {
  const el = document.getElementById('luleaClock');
  if (!el) return;

  function tick() {
    try {
      el.textContent = new Date().toLocaleTimeString('sv-SE', {
        timeZone: 'Europe/Stockholm',
        hour:     '2-digit',
        minute:   '2-digit',
        second:   '2-digit',
        hour12:   false,
      });
    } catch {
      /* Fallback if Intl timeZone not supported */
      el.textContent = new Date().toTimeString().slice(0, 8);
    }
  }

  tick();
  setInterval(tick, 1000);
})();
