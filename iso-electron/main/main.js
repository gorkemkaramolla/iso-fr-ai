const { app, BrowserWindow } = require('electron');
const serve = require('electron-serve');
const path = require('path');
const { spawn } = require('child_process'); // Import the spawn function

const appServe = app.isPackaged
  ? serve({
      directory: path.join(__dirname, '../out'),
    })
  : null;

const createWindow = () => {
  const win = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (app.isPackaged) {
    appServe(win).then(() => {
      win.loadURL('app://-');
    });
  } else {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
    win.webContents.on('did-fail-load', (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }

  // Start the Python script when the window is created
  const pythonProcess = spawn('python', [
    path.join(__dirname, 'python/camera.py'),
  ]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`); // Log Python script output
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`); // Log Python script errors
  });

  pythonProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`); // Log Python script exit code
  });
};

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
