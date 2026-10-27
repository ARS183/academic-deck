// Resolve an npm dependency from the deck directory (cwd) first, then from the skill.
// The skill is usually installed or symlinked outside the deck, so a plain require()
// would miss <deck>/node_modules.
const path = require('path');
const { createRequire } = require('module');
module.exports = function dep(name) {
  try {
    return createRequire(path.join(process.cwd(), 'noop.js'))(name);
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') throw e;
    return require(name);
  }
};
