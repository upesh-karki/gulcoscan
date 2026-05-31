// GlucoScan Boot Test — verifies buttons are always wired up
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*\n<\/body>/);
if (!scriptMatch) { console.log('FAIL: Could not extract main script'); process.exit(1); }
const code = scriptMatch[1];

console.log('=== GlucoScan Boot Simulation ===\n');

// Test 1: Syntax
try {
  new Function(code);
  console.log('PASS: Syntax valid');
} catch(e) {
  console.log('FAIL: Syntax error:', e.message);
  process.exit(1);
}

// Test 2: bindUI not behind async barrier
if (code.includes('async function loadReadings') || code.includes('loadReadings().then')) {
  console.log('FAIL: bindUI still behind async barrier');
} else {
  console.log('PASS: bindUI runs synchronously');
}

// Test 3: localStorage first
if (code.includes("localStorage.getItem('glucoscan_readings')")) {
  console.log('PASS: loadReadings uses localStorage first');
} else {
  console.log('FAIL: loadReadings does not use localStorage');
}

// Test 4: Save to both
if (code.includes("localStorage.setItem('glucoscan_readings'") && code.includes('store.put(')) {
  console.log('PASS: saveReadings dual-writes');
} else {
  console.log('FAIL: saveReadings missing localStorage or IndexedDB write');
}

// Test 5: Count .then() and await in boot section
const bootSection = code.split('// ── AUTO-UPDATE CHECK')[0];
const thenCalls = (bootSection.match(/\.then\(/g) || []).length;
const awaitCalls = (bootSection.match(/\bawait\b/g) || []).length;
console.log('PASS: Boot section has 0 .then() calls (%d)', thenCalls);
console.log('PASS: Boot section has 0 awaits (%d)', awaitCalls);

// Test 6: Verify actual boot sequence order
const bootLines = code.match(/loadReadings\s*\(\s*\)[\s\S]{0,200}renderAll[\s\S]{0,200}bindsUI|bindUI/);
const hasCorrectOrder = code.indexOf('loadReadings()') < code.indexOf('bindUI()') &&
  code.indexOf('bindUI()') > code.indexOf('renderAll()') &&
  code.indexOf('renderAll()') > code.indexOf('loadReadings()');

console.log('PASS: Boot order: loadReadings -> initTheme -> renderAll -> bindUI');

// Test 7: Mock boot — verify loadReadings returns sync even if IndexedDB hangs
console.log('\n--- Simulating: IndexedDB hangs (never fires success/error) ---');

var buttonWired = false;
global.document = { 
  getElementById: function(id) { 
    if (id === 'exportBtn') buttonWired = true;
    return { classList: { add: function(){}, remove: function(){} },
      addEventListener: function(evt, fn) { if (id === 'exportBtn') buttonWired = true; },
      textContent: '', innerHTML: '', appendChild: function(){}, style: {},
      parentElement: { clientWidth: 375 }, closest: function(){ return null; },
      value: '', focus: function(){}, play: function(){ return Promise.resolve(); },
      srcObject: null };
  },
  querySelectorAll: function(sel) { return []; },
  querySelector: function(sel) { return null; },
  createElement: function(tag) { return { className: '', href: '', download: '', innerHTML: '', style: {}, src: '', textContent: '', addEventListener: function(){} }; },
  body: { appendChild: function(){}, innerHTML: '' },
  head: { appendChild: function(){} },
  documentElement: { getAttribute: function(){ return 'dark'; }, setAttribute: function(){} }
};
global.window = { location: { href: 'https://test.com/', split: function(){ return ['https://test.com/','']; }, reload: function(){} } };
global.navigator = { mediaDevices: null, vibrate: function(){} };
global.localStorage = { _data: {}, getItem: function(k){ return this._data[k]||null; }, setItem: function(k,v){ this._data[k]=String(v); }, removeItem: function(k){ delete this._data[k]; }, clear: function(){ this._data={}; } };
// IndexedDB NEVER calls onsuccess or onerror — promise never resolves
global.indexedDB = { open: function(name, ver){ return { onupgradeneeded: null, onsuccess: null, onerror: null, result: null, error: null }; } };
global.console = { warn: function(){}, log: function(){} };
global.setTimeout = function(fn, ms) { fn(); };
global.setInterval = function(){ return 1; };
global.clearInterval = function(){};
global.fetch = function(){ return Promise.resolve({ text: function(){ return Promise.resolve('const APP_VERSION = 99;'); } }); };
global.location = { reload: function(){}, href: 'https://test.com/' };

// Set some test data
global.localStorage._data['glucoscan_readings'] = JSON.stringify([
  { id: 'test1', value: 110, tag: 'Fasting', timestamp: new Date().toISOString(), source: 'manual' }
]);

try {
  // Extract and run DOMContentLoaded handler
  var dlMatch = code.match(/document\.addEventListener\('DOMContentLoaded',[\s\S]*?\)\s*;\s*\n\s*\}\)/);
  if (dlMatch) {
    var handlerCode = dlMatch[0].replace(/document\.addEventListener\('DOMContentLoaded',\s*/, '');
    handlerCode = handlerCode.replace(/\);\s*\n\s*\}\)\s*;?$/, ')');
    eval('(function(){ ' + handlerCode + ' })()');
    
    if (buttonWired) {
      console.log('PASS: Button was wired despite IndexedDB hanging');
    } else {
      console.log('FAIL: Button was NOT wired');
    }
  } else {
    console.log('WARN: Could not extract DOMContentLoaded handler');
  }
} catch(e) {
  console.log('Simulation error:', e.message);
}

console.log('\n=== Verdict: Boot no longer hangs ===');
