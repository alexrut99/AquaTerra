// Starts the real desktop app and checks the things that differ from a browser:
// the page loads from disk, charts draw, the report window opens, nothing throws.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fail = (m) => { console.error('FAIL ' + m); app.exit(1); };
const errors = [];
app.on('web-contents-created', (_, wc) => {
  wc.on('console-message', (e) => { if (e.level === 'error' && !/ERR_|Failed to load/.test(e.message)) errors.push(e.message); });
});
require(path.join(__dirname, '..', 'electron', 'main.js'));
setTimeout(() => fail('timed out'), 120000);
app.whenReady().then(async () => {
  await new Promise((r) => setTimeout(r, 4000));
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return fail('no window');
  const js = (c) => win.webContents.executeJavaScript(c, true);
  const libs = await js("typeof Chart + typeof L + typeof XLSX + typeof JSZip");
  if (libs !== 'functionobjectobjectfunction') return fail('libraries: ' + libs);
  const T = await js("autoFit('theis'); parseFloat(document.getElementById('theis_resT').textContent)");
  if (!(T > 0)) return fail('auto fit');
  const png = await js("Chart.getChart(document.getElementById('theisChart')).toBase64Image().length");
  if (png < 1000) return fail('chart did not draw');
  await js("showReportConfig(); generateReportFromConfig(); 1");
  await new Promise((r) => setTimeout(r, 2500));
  const wins = BrowserWindow.getAllWindows();
  if (wins.length < 2) return fail('report window did not open');
  const rep = wins.find((w) => w !== win);
  const heads = await rep.webContents.executeJavaScript("document.querySelectorAll('h3').length");
  if (!(heads > 2)) return fail('report is empty');
  if (errors.length) return fail('errors: ' + errors.join(' | '));
  console.log(`PASS desktop app: T=${T}, report sections=${heads}`);
  app.exit(0);
});
