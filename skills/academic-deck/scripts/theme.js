'use strict';

/**
 * theme.js — resolve the deck's theme from deck.config.json.
 *
 * A theme is a folder under themes/ with a theme.json. The default is tudelft.
 *   const { loadTheme } = require('./theme');
 *   const t = loadTheme(deckDir);   // { name, dir, json, fonts, css: [paths], assets: {key: path} }
 */

const fs = require('fs');
const path = require('path');

const THEMES = path.resolve(__dirname, '..', 'themes');
const DEFAULT_THEME = 'tudelft';

function listThemes() {
  return fs.readdirSync(THEMES)
    .filter((d) => fs.existsSync(path.join(THEMES, d, 'theme.json')))
    .sort();
}

function configTheme(deckDir) {
  const p = path.join(deckDir, 'deck.config.json');
  if (!fs.existsSync(p)) return DEFAULT_THEME;
  const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
  return cfg.theme || DEFAULT_THEME;
}

function loadTheme(deckDir, override) {
  const name = override || configTheme(deckDir);
  const dir = path.join(THEMES, name);
  const jsonPath = path.join(dir, 'theme.json');
  if (!fs.existsSync(jsonPath)) {
    const err = new Error(`unknown theme "${name}"; available: ${listThemes().join(', ')}`);
    err.code = 'THEME_UNKNOWN';
    throw err;
  }
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rel = (p) => path.resolve(dir, p);
  return {
    name,
    dir,
    json,
    fonts: json.fonts ? rel(json.fonts) : null,
    css: (json.css || []).map(rel),
    assets: Object.fromEntries(Object.entries(json.assets || {}).map(([k, v]) => [k, rel(v)])),
    footer: { fields: ['short', 'num'], num: '{n}', onTitle: false, countTitle: true, ...(json.footer || {}) },
  };
}

module.exports = { THEMES, DEFAULT_THEME, listThemes, loadTheme };
