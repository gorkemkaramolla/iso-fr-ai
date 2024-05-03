const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

app.on('ready', () => {
  let mainWindow = new BrowserWindow({
    fullscreen: true,
    icon: path.join(__dirname, 'iso_logo_yazisiz.jpg'), // Add this line
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Pointing to the preload script
      contextIsolation: true, // Security feature
      nodeIntegration: false, // Security feature
    },
  });

  mainWindow.loadURL('http://localhost:3000');

  const { shell, ipcMain } = require('electron');
  const { exec } = require('child_process');

  ipcMain.on('open-url', (event, url) => {
    let command;
    switch (process.platform) {
      case 'darwin':
        command = `open -a "Google Chrome" ${url}`;
        break;
      case 'win32':
        command = `"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" --app=${url}`;
        break;
      default:
        command = `google-chrome ${url}`;
        break;
    }
    exec(command);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
