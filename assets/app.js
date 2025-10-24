/* PWA + Offline Otomatik Kaydetme + Basit UI */
(() => {
  const S = window.localStorage;
  const KEY_PREFIX = 'planner:' + location.pathname + ':';

  // Yıl
  document.getElementById('yil').textContent = new Date().getFullYear();

  // Sekmeler
  const tabButtons = document.querySelectorAll('.tabs button');
  const tabs = new Map([...document.querySelectorAll('.tab')].map(el => [el.id.replace('tab-',''), el]));
  let current = 'gunluk';
  function showTab(name) {
    current = name;
    tabButtons.forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false'));
    tabs.forEach((el, key) => el.classList.toggle('active', key === name));
  }
  tabButtons.forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  showTab('gunluk');

  // Persist helpers
  function keyFor(el) { const id = el.id || el.name; return id ? KEY_PREFIX + id : null; }
  function restore(el) {
    const k = keyFor(el); if (!k) return;
    const v = S.getItem(k); if (v === null) return;
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = v === 'true';
    else if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') el.value = v;
    else el.textContent = v;
  }
  function persist(el) {
    const k = keyFor(el); if (!k) return;
    const v = (el.type === 'checkbox' || el.type === 'radio') ? String(el.checked)
      : (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') ? el.value
      : el.textContent;
    try { S.setItem(k, v); } catch (e) { console.warn('Kaydedilemedi (kota dolu mu?):', e); }
  }
  window.addEventListener('DOMContentLoaded', () => {
    const els = document.querySelectorAll('[data-persist]');
    els.forEach(restore);
    els.forEach((el) => {
      el.addEventListener('input', () => persist(el));
      el.addEventListener('change', () => persist(el));
    });
  });

  // Tema
  const THEME_KEY = KEY_PREFIX + 'theme-dark';
  const themeToggle = document.getElementById('theme-toggle');
  function applyTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    themeToggle.checked = dark;
    try { S.setItem(THEME_KEY, String(dark)); } catch {}
  }
  applyTheme(S.getItem(THEME_KEY) === 'true');
  themeToggle.addEventListener('change', e => applyTheme(e.target.checked));

  // Dışa / içe aktar
  function download(filename, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type: 'application/json'}));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  document.getElementById('btn-export').addEventListener('click', () => {
    const data = {};
    Object.keys(S).forEach(k => { if (k.startsWith(KEY_PREFIX)) data[k.slice(KEY_PREFIX.length)] = S.getItem(k); });
    download('planner-data.json', JSON.stringify(data, null, 2));
  });
  document.getElementById('file-import').addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      Object.entries(data).forEach(([k, v]) => S.setItem(KEY_PREFIX + k, v));
      // sayfayı yenilemeden alanları güncelle
      document.querySelectorAll('[data-persist]').forEach(restore);
      alert('Veri içe aktarıldı.');
    } catch (err) {
      alert('İçe aktarma hatası: ' + err.message);
    } finally {
      e.target.value = '';
    }
  });
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (!confirm('Tüm veriyi silmek istediğine emin misin? Bu cihaz için geri alınamaz.')) return;
    const keys = [];
    for (let i = 0; i < S.length; i++) {
      const k = S.key(i); if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
    }
    keys.forEach(k => S.removeItem(k));
    document.querySelectorAll('[data-persist]').forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      else if ('value' in el) el.value = '';
      else el.textContent = '';
    });
  });

  // PWA: Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(console.error);
    });
  }

  // PWA: Install prompt (Chrome/Edge)
  let deferredPrompt = null;
  const installBtn = document.getElementById('btn-install');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async () => {
    installBtn.hidden = true;
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
})();
