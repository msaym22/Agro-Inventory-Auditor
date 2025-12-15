const express = require('express');
const router = express.Router();
let translate;
try {
  // Lazy require to avoid crashing if package missing
  ({ translate } = require('@vitalets/google-translate-api'));
} catch (e) {
  translate = null;
}

// Simple proxy to avoid browser CORS for translation requests
router.post('/', async (req, res) => {
  // Keep original text available for fallback responses even if an error occurs
  const originalText = (req.body && req.body.q) ? req.body.q : '';
  try {
    const { q = originalText, source = 'en', target = 'ur', format = 'text' } = req.body || {};
    // If the name ends with standalone English letters (e.g., "belt d"),
    // translate the main part and keep the trailing letters as-is.
    const splitTrailingStandaloneLetters = (text) => {
      const tokens = String(text).trim().split(/\s+/);
      if (tokens.length === 0) {
        return { main: '', trailing: '' };
      }
      const trailing = [];
      for (let i = tokens.length - 1; i >= 0; i -= 1) {
        const t = tokens[i];
        if (/^[A-Za-z]$/.test(t)) {
          trailing.unshift(t);
        } else {
          // stop at first non-single-letter token from the end
          const main = tokens.slice(0, i + 1).join(' ');
          return { main, trailing: trailing.join(' ') };
        }
      }
      // all tokens were single letters -> don't split
      return { main: text, trailing: '' };
    };
    const { main: mainTextForTranslate, trailing: trailingLetters } = splitTrailingStandaloneLetters(q);
    if (!q || !source || !target) {
      return res.status(400).json({ error: 'Missing required fields: q, source, target' });
    }

    const controllers = [];
    const withTimeout = (ms) => {
      const controller = new AbortController();
      controllers.push(controller);
      const timer = setTimeout(() => controller.abort(), ms);
      return { controller, timer };
    };

    // Multiple providers with different response shapes
    const providers = [
      // Prefer google-translate-api if available (best quality)
      translate && {
        name: 'Google Translate API (unofficial)',
        endpoint: 'local-module',
        buildRequest: () => null, // handled specially below
        parse: async (_) => null // unused
      },
      {
        name: 'LibreTranslate (DE)',
        endpoint: process.env.LIBRE_TRANSLATE_URL || 'https://libretranslate.de/translate',
        buildRequest: () => ({
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ q, source, target, format })
        }),
        parse: async (response) => {
          const json = await response.json();
          return json && (json.translatedText || (json.data && json.data.translations && json.data.translations[0] && json.data.translations[0].translatedText));
        }
      },
      {
        name: 'Argos OpenTech',
        endpoint: 'https://translate.argosopentech.com/translate',
        buildRequest: () => ({
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ q, source, target, format })
        }),
        parse: async (response) => {
          const json = await response.json();
          return json && json.translatedText;
        }
      },
      {
        name: 'MyMemory (public)',
        endpoint: `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(source)}|${encodeURIComponent(target)}`,
        buildRequest: () => ({ method: 'GET', headers: { 'Accept': 'application/json' } }),
        parse: async (response) => {
          const json = await response.json();
          return json && json.responseData && json.responseData.translatedText;
        }
      },
      // Aksharamukha transliteration as additional fallback (Latin -> Urdu script)
      {
        name: 'Aksharamukha Transliteration',
        endpoint: 'https://aksharamukha-plugin.appspot.com/api/transliterate',
        buildRequest: () => ({
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            text: q,
            source: 'ISO',
            target: 'Urdu'
          })
        }),
        parse: async (response) => {
          const json = await response.json();
          // API returns plain string or object depending on deployment; handle both
          if (typeof json === 'string') return json;
          if (json && typeof json.text === 'string') return json.text;
          return null;
        }
      }
    ];

    let lastError = null;
    for (const provider of providers) {
      if (!provider) continue;
      const { controller, timer } = withTimeout(5000);
      try {
        // Handle local module branch
        if (provider.endpoint === 'local-module') {
          clearTimeout(timer);
          const result = await translate(mainTextForTranslate || q, { from: source || 'auto', to: target || 'ur' });
          if (result && result.text) {
            const merged = trailingLetters ? `${result.text} ${trailingLetters}` : result.text;
            return res.json({ translatedText: merged });
          }
          lastError = new Error('google-translate-api returned empty');
          continue;
        }

        // Build request; for HTTP providers that send body, replace q with mainTextForTranslate
        const baseReq = provider.buildRequest();
        let requestInit = baseReq;
        if (baseReq && typeof baseReq === 'object' && 'body' in baseReq && typeof baseReq.body === 'string') {
          try {
            const parsed = JSON.parse(baseReq.body);
            parsed.q = mainTextForTranslate || q;
            requestInit = { ...baseReq, body: JSON.stringify(parsed) };
          } catch (_) {
            // ignore
          }
        }
        let endpoint = provider.endpoint;
        if (endpoint.includes('mymemory.translated.net/get')) {
          endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(mainTextForTranslate || q)}&langpair=${encodeURIComponent(source)}|${encodeURIComponent(target)}`;
        }

        const response = await fetch(endpoint, { ...requestInit, signal: controller.signal });
        clearTimeout(timer);
        if (!response.ok) {
          lastError = new Error(`Upstream responded ${response.status}`);
          continue;
        }
        const translated = await provider.parse(response);
        if (translated && typeof translated === 'string') {
          const merged = trailingLetters ? `${translated} ${trailingLetters}` : translated;
          return res.json({ translatedText: merged });
        }
        lastError = new Error(`${provider.name} returned unexpected shape`);
        continue;
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    // If all providers failed, attempt transliteration for Latin input (names)
    // Detect plain ASCII to trigger transliteration for names like "saim"
    const isLikelyLatin = typeof q === 'string' && /^[\x00-\x7F]*$/.test(q);
    if (isLikelyLatin && (mainTextForTranslate || q).trim().length > 0) {
      const { controller, timer } = withTimeout(4000);
      try {
        const url = `https://inputtools.google.com/request?text=${encodeURIComponent(mainTextForTranslate || q)}&itc=ur-t-i0-und&num=1`;
        const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' }, signal: controller.signal });
        clearTimeout(timer);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data) && data[0] === 'SUCCESS' && Array.isArray(data[1]) && Array.isArray(data[1][0]) && Array.isArray(data[1][0][1]) && typeof data[1][0][1][0] === 'string') {
            const candidate = data[1][0][1][0];
            if (candidate && candidate.trim().length > 0) {
              const merged = trailingLetters ? `${candidate} ${trailingLetters}` : candidate;
              return res.status(200).json({ translatedText: merged });
            }
          }
        }
      } catch (e) {
        // ignore and fall through to echo fallback
      }
    }
    // If everything fails, return graceful fallback rather than 500
    return res.status(200).json({ translatedText: trailingLetters ? `${q} ${trailingLetters}` : q });
  } catch (err) {
    // Never reference out-of-scope variables in catch; use preserved originalText
    return res.status(200).json({ translatedText: originalText });
  }
});

module.exports = router;


