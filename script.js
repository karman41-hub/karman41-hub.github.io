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

  /* Publications */
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
})();

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

  document.addEventListener('mousemove', e => {
    spotlight.style.background =
      `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(100,255,218,0.05), transparent 40%)`;
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
      const res = await fetch('https://formspree.io/f/xjgjzlgq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Network error');
      form.style.display = 'none';
      success.style.display = 'block';
    } catch {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i> Send Message';
      showError('fmessage', 'messageError', 'Send failed — email karthikm4148@gmail.com directly.');
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
