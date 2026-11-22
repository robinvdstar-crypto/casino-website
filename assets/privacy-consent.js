/* Basic consent: no Google tag or analytics event is loaded before opt-in. */
(() => {
  'use strict';
  if (window.SitePrivacy) return;
  const script = document.currentScript;
  const measurementId = script?.dataset.measurementId;
  if (!/^G-[A-Z0-9]+$/.test(measurementId || '')) return;
  const version = '2026-11-22.1';
  const key = 'site-privacy-consent'; // localStorage is scoped to this origin, never shared between domains.
  const disabledKey = `ga-disable-${measurementId}`;
  let choice = readChoice();
  let started = false;
  let tagReady = Promise.resolve(false);
  let consentEpoch = 0;
  const leads = new WeakSet();
  let lastFocus;
  let panel;

  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      if (value?.version === version && typeof value.analytics === 'boolean'
          && typeof value.at === 'string' && Number.isFinite(Date.parse(value.at))
          && Date.parse(value.at) <= Date.now()) return value;
    } catch (_) { /* Without storage, consent applies only to this page. */ }
    return null;
  }
  function hasConsent() { return choice?.analytics === true; }
  window[disabledKey] = !hasConsent();
  // Google's opt-out flag blocks new events but does not discard an already
  // buffered batch flushed on navigation. Check consent at the transport boundary too.
  // Only Analytics collector hosts are affected; Web3Forms and other requests pass through.
  function blockedAnalyticsRequest(input) {
    if (hasConsent()) return false;
    try {
      const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
      return /(^|\.)(google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com)$/.test(url.hostname);
    } catch (_) { return false; }
  }
  const originalFetch = window.fetch;
  if (originalFetch) window.fetch = function (input, options) {
    if (blockedAnalyticsRequest(input)) return Promise.resolve(new Response(null, {status: 204}));
    return originalFetch.call(this, input, options);
  };
  const originalBeacon = navigator.sendBeacon;
  if (originalBeacon) navigator.sendBeacon = function (url, data) {
    // Intentionally discard rather than trigger Google's alternative delivery methods.
    if (blockedAnalyticsRequest(url)) return true;
    return originalBeacon.call(this, url, data);
  };


  function clearAnalyticsCookies() {
    const names = [...new Set(['_ga', '_ga_' + measurementId.slice(2), ...document.cookie.split(';').map(item => item.trim().split('=')[0])
      .filter(name => /^(_ga(?:_|$)|_gid$|_gat(?:_|$)|_gac_|_gcl_)/.test(name))])];
    const labels = location.hostname.split('.');
    const domains = ['', ...labels.map((_, i) => labels.slice(i).join('.'))];
    const parts = location.pathname.split('/').filter(Boolean);
    const paths = new Set(['/']);
    for (let i = 1; i <= parts.length; i++) {
      paths.add('/' + parts.slice(0, i).join('/'));
      paths.add('/' + parts.slice(0, i).join('/') + '/');
    }
    names.forEach(name => domains.forEach(domain => paths.forEach(path => {
      document.cookie = `${name}=; Max-Age=0; path=${path}${domain ? `; domain=${domain}` : ''}; SameSite=Lax`;
    })));
  }
  function startAnalytics() {
    if (!hasConsent() || started) return;
    started = true;
    window[disabledKey] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      if (hasConsent() && !window[disabledKey]) window.dataLayer.push(arguments);
    };
    const deniedAds = {ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'};
    window.gtag('consent', 'default', {...deniedAds, analytics_storage: 'denied'});
    window.gtag('consent', 'update', {...deniedAds, analytics_storage: 'granted'});
    window.gtag('set', 'ads_data_redaction', true);
    // Do not send query strings, fragments, referrer query strings, form fields or enhanced user data.
    window.gtag('set', 'page_location', location.origin + location.pathname);
    let referrer = '';
    try { const url = new URL(document.referrer); referrer = url.origin + url.pathname; } catch (_) {}
    window.gtag('set', 'page_referrer', referrer);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 15552000, // 180 days; separate from GA4 property data retention.
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure',
      transport_type: 'beacon'
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.dataset.siteAnalytics = '';
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    tagReady = new Promise(resolve => {
      tag.addEventListener('load', () => resolve(true), {once: true});
      tag.addEventListener('error', () => resolve(false), {once: true});
    });
    document.head.append(tag);
  }
  function closePanel() {
    panel.hidden = true;
    lastFocus?.focus();
  }
  function choose(analytics) {
    consentEpoch++;
    choice = {version, analytics, at: new Date().toISOString()};
    window[disabledKey] = !analytics;
    try { localStorage.setItem(key, JSON.stringify(choice)); } catch (_) {}
    if (analytics) startAnalytics();
    else clearAnalyticsCookies();
    // ga-disable prevents cookie writes and collection by an already loaded Google runtime.
    // Do not send a denied-consent ping or reload: keep unsent form input intact.
    closePanel();
  }
  function openSettings() {
    lastFocus = document.activeElement;
    panel.hidden = false;
    panel.querySelector('button').focus();
  }
  async function lead(form) {
    // Only the confirmed-success branch calls this. Never replay after later consent.
    if (!form || leads.has(form)) return false;
    leads.add(form);
    if (!hasConsent()) return false;
    const epoch = consentEpoch;
    // A bounded wait lets a slow tag process the event before the existing redirect.
    // A blocked/failed tag cannot hold up a confirmed request beyond 500 ms.
    const deadline = performance.now() + 500;
    let timer;
    try {
      const loaded = await Promise.race([tagReady, new Promise(resolve => {
        timer = setTimeout(() => resolve(false), 500);
      })]);
      clearTimeout(timer);
      if (!loaded || !hasConsent() || consentEpoch !== epoch || performance.now() >= deadline) return false;
      return await new Promise(resolve => {
        let settled = false;
        const done = value => { if (!settled) { settled = true; clearTimeout(timer); resolve(value); } };
        const remaining = Math.max(0, Math.ceil(deadline - performance.now()));
        timer = setTimeout(() => done(false), remaining);
        try {
          window.gtag?.('event', 'generate_lead', {
            send_to: measurementId, transport_type: 'beacon',
            event_callback: () => done(true), event_timeout: remaining
          });
        } catch (_) { done(false); }
      });
    } catch (_) { return false; }
    finally { clearTimeout(timer); }
  }
  window.SitePrivacy = Object.freeze({openSettings, lead, hasConsent});
  if (hasConsent()) startAnalytics(); else clearAnalyticsCookies();

  panel = document.createElement('section');
  panel.className = 'site-consent';
  panel.setAttribute('aria-labelledby', 'site-consent-title');
  panel.setAttribute('role', 'region');
  panel.hidden = !!choice;
  panel.innerHTML = `<h2 id="site-consent-title">Jouw privacykeuze</h2>
    <p>We gebruiken Google Analytics alleen met jouw toestemming voor bezoekstatistieken en succesvolle aanvragen. Advertentietoestemming blijft uit. Formulieren werken ook zonder Analytics.</p>
    <p><a href="/privacy/">Privacyverklaring</a>. Je kunt je keuze via ‘Privacy-instellingen’ aanpassen. Intrekken stopt verdere Analytics-meting zonder de pagina te herladen.</p>
    <div class="site-consent-actions"><button type="button" data-choice="no">Alleen noodzakelijk</button><button type="button" data-choice="yes">Statistieken toestaan</button></div>
    <button class="site-consent-video-reset" type="button" hidden>Geladen YouTube-video’s verwijderen</button>`;
  panel.querySelector('[data-choice="no"]').addEventListener('click', () => choose(false));
  panel.querySelector('[data-choice="yes"]').addEventListener('click', () => choose(true));
  panel.addEventListener('keydown', event => { if (event.key === 'Escape' && choice) closePanel(); });
  document.body.append(panel);
  document.querySelectorAll('[data-privacy-settings]').forEach(button => button.addEventListener('click', openSettings));

  // Separate, per-video choice; no third-party image, iframe or preconnect before clicking.
  const resetVideos = panel.querySelector('.site-consent-video-reset');
  const videos = [...document.querySelectorAll('template[data-youtube]')];
  function videoPlaceholder(template) {
    const old = template.nextElementSibling;
    if (old?.matches('[data-video-container]')) old.remove();
    const container = document.createElement('div');
    container.dataset.videoContainer = '';
    container.className = 'site-video-choice';
    const button = document.createElement('button');
    button.type = 'button';
    const title = template.content.querySelector('iframe')?.title || 'Video';
    button.textContent = `${title} — YouTube laden`;
    const text = document.createElement('p');
    text.textContent = 'Pas na je klik maakt je browser verbinding met YouTube/Google. Dit staat los van je Analytics-keuze.';
    container.append(text, button);
    button.addEventListener('click', () => {
      const iframe = template.content.querySelector('iframe').cloneNode(true);
      iframe.src = iframe.dataset.src;
      iframe.removeAttribute('data-src');
      container.replaceChildren(iframe);
      resetVideos.hidden = false;
    });
    template.after(container);
  }
  videos.forEach(videoPlaceholder);
  resetVideos.addEventListener('click', () => { videos.forEach(videoPlaceholder); resetVideos.hidden = true; });

  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    consentEpoch++;
    choice = readChoice();
    window[disabledKey] = !hasConsent();
    if (hasConsent()) startAnalytics(); else clearAnalyticsCookies();
    panel.hidden = !!choice;
  });
})();
