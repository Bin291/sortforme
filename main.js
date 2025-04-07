const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
    }
  });

  const indexPath = isDev
    ? 'http://localhost:4200'
    : `file://${path.join(__dirname, '/dist/angular-desktop-app/browser/index.html')}`;

  win.loadURL(indexPath);

  // 👉 Thêm phần này để debug nếu load lỗi
  win.webContents.on('did-fail-load', (e, errorCode, errorDesc) => {
    console.error('❌ Failed to load:', errorCode, errorDesc);
  });

  win.webContents.openDevTools(); // ❗ Tuỳ chọn: bật dev tools để xem log bên trong
}

app.whenReady().then(() => {
  console.log("✅ App started");
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
