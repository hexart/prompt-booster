// apps/web/src/env.js

// Make Buffer available globally
window.Buffer = Buffer || {};
global.Buffer = Buffer;

// Add process for libraries that expect it
window.process = window.process || { env: {} };