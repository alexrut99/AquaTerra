// AquaTerra desktop app: the same page as the website, in its own window, working offline.
const { app, BrowserWindow, Menu, shell, dialog, session } = require('electron');
const path = require('path');

const WEB_DIR = path.join(__dirname, '..', 'web');
const ICON = path.join(__dirname, '..', 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
const REPO = 'https://github.com/alexrut99/AquaTerra';

if (!app.requestSingleInstanceLock()) app.quit();

let mainWindow = null;
const isExternal = (url) => /^https?:\/\//i.test(url);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1000, minHeight: 640,
    title: 'AquaTerra — Pumping Test Analysis',
    icon: ICON,
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });

  mainWindow.loadFile(path.join(WEB_DIR, 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Reports open in a blank window the page writes into; links to websites open in the browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternal(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 1100, height: 900, icon: ICON, title: 'AquaTerra — Report', autoHideMenuBar: true,
        webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
      },
    };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isExternal(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'Print…', accelerator: 'CmdOrCtrl+P', click: (_, w) => w && w.webContents.print() },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Exit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' }, { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' },
        { role: 'togglefullscreen' }, { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'AquaTerra on GitHub', click: () => shell.openExternal(REPO) },
        { label: 'Report a problem', click: () => shell.openExternal(`${REPO}/issues`) },
        {
          label: 'About AquaTerra',
          click: () => dialog.showMessageBox({
            type: 'info',
            title: 'About AquaTerra',
            message: `AquaTerra ${app.getVersion()}`,
            detail: 'Pumping Test Analysis Software\n© 2025–2026 Anirut Ladawadee\nApache License 2.0\n\nProvided "as is", without warranty of any kind. Results must be reviewed by a qualified professional before use.',
            icon: path.join(__dirname, '..', 'build', 'icon.png'),
          }),
        },
      ],
    },
  ]));
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

// Write the auto-saved session to disk before the app exits
app.on('before-quit', () => { session.defaultSession.flushStorageData(); });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
