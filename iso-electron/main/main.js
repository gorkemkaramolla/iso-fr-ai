const { app, BrowserWindow } = require('electron');
const serve = require('electron-serve');
const path = require('path');

// Determine the correct icon based on the platform
let iconPath;
if (process.platform === 'win32') {
  iconPath = path.join(__dirname, '../assets/icons/app-icon.ico');
} else if (process.platform === 'darwin') {
  iconPath = path.join(__dirname, '../assets/icons/app-icon.icns');
} else {
  iconPath = path.join(__dirname, '../assets/icons/app-icon.png');
}

// Serve the built files from the 'out' directory
const appServe = app.isPackaged
  ? serve({
      directory: path.join(__dirname, '../out'),
    })
  : null;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconPath, // Set the platform-specific icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (app.isPackaged) {
    appServe(win)
      .then(() => {
        win.loadURL('app://-'); // Load from the bundled files
        win.webContents.openDevTools();
      })
      .catch((err) => {
        console.error('Failed to load URL:', err);
      });
  } else {
    win.loadURL('http://localhost:3000'); // Load from the development server
    win.webContents.openDevTools();
    win.webContents.on('did-fail-load', () => {
      win.webContents.reloadIgnoringCache();
    });
  }
};

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
