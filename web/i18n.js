// AquaTerra interface language. The page keeps its source text; this layer shows every text node,
// tooltip, chart label and dialog in the chosen language. Calculations never read translated text
// as data: inputs' values, ids and numbers are left alone.
(function () {
  const STORE = 'aquaterraLang';
  const LETTERS = /[A-Za-z฀-๿]/;
  const LEAD = /^[\s\u{1F000}-\u{1FAFF}←-⇿⌀-⏿■-➿⬀-⯿️‍•·|:.,()\-–—→]+/u;
  const TRAIL = /[\s\u{1F000}-\u{1FAFF}⌀-⏿☀-➿️‍•·|:,\-–—→]+$/u;
  const NUM = /(?<![A-Za-z_₀-₉])\d+(?:\.\d+)?(?:e[-+]?\d+)?(?![A-Za-z_])/g;
  const ATTRS = ['title', 'placeholder', 'aria-label'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT']);
  const exact = new Map();
  const wild = [];
  const cache = { th: new Map(), en: new Map() };
  let lang = 'th';

  const clean = (s) => s.replace(/\s+/g, ' ').trim();
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Dictionary text is matched the way page text is: without leading or trailing marks, numbers as {#}
  const strip = (t) => clean(t.replace(LEAD, '').replace(TRAIL, ''));
  const keyOf = (t) => strip(t).replace(NUM, '{#}');

  function index(raw) {
    const entry = { en: strip(raw.en), th: strip(raw.th) };
    for (const key of new Set([keyOf(raw.k), keyOf(raw.en), keyOf(raw.th)])) {
      if (!key) continue;
      if (key.includes('{*}')) {
        const literal = key.replace(/\{[*#]\}/g, '');
        if ((literal.match(/[A-Za-z฀-๿]/g) || []).length < 4) continue;
        const re = new RegExp('^' + key.split(/(\{[*#]\})/).map((p) => (p === '{*}' ? '(.+?)' : p === '{#}' ? '(\\S+?)' : escapeRe(p))).join('') + '$');
        wild.push({ re, entry });
      } else if (!exact.has(key)) {
        exact.set(key, entry);
      }
    }
  }

  function fill(template, values) {
    let i = 0;
    return template.replace(/\{[*#]\}/g, () => (i < values.length ? values[i++] : ''));
  }

  function translate(text, to) {
    const target = to || lang;
    if (!text || !LETTERS.test(text)) return text;
    const c = cache[target];
    if (c.has(text)) return c.get(text);
    if (text.includes('\n') && text.trim().includes('\n')) {
      const joined = text.split('\n').map((line) => translate(line, target)).join('\n');
      c.set(text, joined);
      return joined;
    }
    const lead = (text.match(LEAD) || [''])[0];
    const body = text.slice(lead.length);
    const trail = (body.match(TRAIL) || [''])[0];
    const core = clean(body.slice(0, body.length - trail.length));
    let result = text;
    if (core) {
      const nums = [];
      const key = core.replace(NUM, (m) => { nums.push(m); return '{#}'; });
      const hit = exact.get(key);
      if (hit) {
        result = lead + fill(hit[target], nums) + trail;
      } else {
        for (const w of wild) {
          const m = core.match(w.re);
          if (m) { result = lead + fill(w.entry[target], m.slice(1).map((v) => translate(v, target))) + trail; break; }
        }
      }
    }
    if (c.size > 20000) c.clear();
    c.set(text, result);
    return result;
  }

  // ---- text in the page ----
  const srcText = new WeakMap(); // node → { source, shown }
  const srcAttr = new WeakMap(); // element → { attr: { source, shown } }

  function applyText(node, to) {
    const value = node.nodeValue;
    const known = srcText.get(node);
    const source = known && known.shown === value ? known.source : value;
    const shown = translate(source, to);
    srcText.set(node, { source, shown });
    if (shown !== value) node.nodeValue = shown;
  }

  function applyAttrs(el, to) {
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const store = srcAttr.get(el) || {};
      const value = el.getAttribute(a);
      const known = store[a];
      const source = known && known.shown === value ? known.source : value;
      const shown = translate(source, to);
      store[a] = { source, shown };
      srcAttr.set(el, store);
      if (shown !== value) el.setAttribute(a, shown);
    }
  }

  function applyTree(root, to) {
    if (root.nodeType === 3) { if (!SKIP.has(root.parentNode?.nodeName)) applyText(root, to); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) {
      if (SKIP.has(root.nodeName) || root.classList.contains('no-i18n')) return;
      applyAttrs(root, to);
    }
    const doc = root.ownerDocument || root;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (n.nodeType === 1 && (SKIP.has(n.nodeName) || n.classList.contains('no-i18n'))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeType === 3) applyText(n, to); else applyAttrs(n, to);
    }
  }

  // ---- charts draw on canvas, so their words are translated when they are built ----
  function chartWords(config) {
    const tr = (s) => (typeof s === 'string' ? translate(s) : Array.isArray(s) ? s.map(tr) : s);
    const o = config.options || {};
    if (o.plugins && o.plugins.title && o.plugins.title.text) o.plugins.title.text = tr(o.plugins.title.text);
    Object.values(o.scales || {}).forEach((axis) => { if (axis.title && axis.title.text) axis.title.text = tr(axis.title.text); });
    ((config.data && config.data.datasets) || []).forEach((d) => { if (d.label) d.label = tr(d.label); });
    if (config.data && Array.isArray(config.data.labels)) config.data.labels = config.data.labels.map(tr);
  }
  if (window.Chart) {
    const Base = window.Chart;
    window.Chart = class extends Base {
      constructor(item, config) { try { chartWords(config); } catch (e) {} super(item, config); }
    };
  }

  // ---- browser dialogs ----
  const nativeConfirm = window.confirm.bind(window);
  const nativeAlert = window.alert.bind(window);
  window.confirm = (m) => nativeConfirm(translate(String(m)));
  window.alert = (m) => nativeAlert(translate(String(m)));

  function chooseLanguage() {
    let saved = null;
    try { saved = localStorage.getItem(STORE); } catch (e) {}
    if (saved === 'th' || saved === 'en') return saved;
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'th' || q === 'en') return q;
    return (navigator.language || '').toLowerCase().startsWith('th') ? 'th' : 'en';
  }

  function markSwitch() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang]').forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // Ready before the first chart is drawn
  ((window.I18N_DICT) || []).forEach(index);
  lang = chooseLanguage();

  window.I18N = {
    t: (s) => translate(s),
    lang: () => lang,
    applyTo: (root) => applyTree(root, lang),
    set(next) {
      if (next !== 'th' && next !== 'en') return;
      lang = next;
      try { localStorage.setItem(STORE, next); } catch (e) {}
      markSwitch();
      applyTree(document.body, lang);
      if (typeof window.redrawAllCharts === 'function') window.redrawAllCharts();
    },
    init() {
      markSwitch();
      applyTree(document.body, lang);
      new MutationObserver((records) => {
        for (const r of records) {
          if (r.type === 'characterData') applyText(r.target, lang);
          else if (r.type === 'attributes') applyAttrs(r.target, lang);
          else r.addedNodes.forEach((n) => applyTree(n, lang));
        }
      }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    },
  };
})();
