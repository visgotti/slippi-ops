import { join } from 'path';
import * as fs from 'fs';
import {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    Menu,
    shell 
} from 'electron';
import { TRACKER_EVENTS } from '@slippiops/types';
import { MatchTracker } from '@slippiops/tracker-core';
// import { autoUpdater, AppUpdater } from 'electron-updater';
Menu.setApplicationMenu(null);

// autoUpdater.autoDownload = false;
// autoUpdater.autoInstallOnAppQuit = true;

import * as os from 'os';
const numCPUs = os.cpus().length;


const platform = os.platform();
let iconFile = join(__dirname, '../../resources/icon');
if (platform === 'win32') {
  iconFile = `${iconFile}.ico`;
} else if (platform === 'darwin') {
  iconFile = `${iconFile}.icns`;
} else {
  iconFile = `${iconFile}.png`;
}

let mainWindow : BrowserWindow | null = null;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        icon: iconFile,
        width: 800,
        title: 'Slippi Ops',
        height: 610,
        webPreferences: {
            webSecurity: false,
            nodeIntegration : true,
            preload: join(__dirname, '../preload/preload.js'),
        },
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    
    if (isDev) {
        mainWindow.webContents.openDevTools();
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow?.webContents.send('tracker-event', { event: TRACKER_EVENTS.NUM_CPUS, data: numCPUs });
    })

    ipcMain.handle('get-download-directory', async () => {
      if(!mainWindow) { return };
      const result = await dialog.showSaveDialog(mainWindow, {
        title: "Select Download Destination",
      });
      if(result.canceled) {
        return { status: 'canceled'};
      }
      return { status: 'success', path: result.filePath}
    });

    ipcMain.handle('get-download-file', async (_, payload?: string) => {
      if(!mainWindow) { return };
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: payload,
        title: "Select Download Destination",
      });
      if(result.canceled) {
        return { status: 'canceled'};
      }
      return { status: 'success', path: result.filePath}
    });

    
    ipcMain.handle('get-download-json', async (_, payload?: string) => {
      if(!mainWindow) { return };
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: payload,
        title: "Select Download Destination",
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if(result.canceled) {
        return { status: 'canceled'};
      }
      return { status: 'success', path: result.filePath}
    });

    ipcMain.handle('select-dir', async (_) => {
      if(!mainWindow) { return };
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
      });
      if(result.canceled) {
        return { status: 'canceled'};
      }
      return { status: 'success', path: result.filePaths[0]}
    });

    ipcMain.handle('select-json', async () => {
      if(!mainWindow) { return };
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if(result.canceled) {
        return { status: 'canceled'};
      }
      return { status: 'success', path: result.filePaths[0]}
    })

    ipcMain.handle('select-file', async (_) => {
      if(!mainWindow) { return };
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile']
      });
      if(result.canceled) {
        return { status: 'canceled'};
      }
      return { status: 'success', path: result.filePaths[0]}
    });

    ipcMain.handle('reveal-file', async (_, path: string) => {
      if(!mainWindow) { return };
      if(!fs.existsSync(path)) {
        throw new Error(`File at path: ${path} does not exist`);
      }
      shell.showItemInFolder(path);
    });


    ipcMain.on('db-import-event', (_, data) => {
      if(!mainWindow) { return };
      mainWindow?.webContents.send('db-import-event', data);
    });

    ipcMain.on('tracker-event', (_, data) => {
      if(!mainWindow) { return };
      mainWindow?.webContents.send('tracker-event', data);
    });
    // mainWindow.loadURL( //this doesn't work on macOS in build and preview mode
    //     isDev ?
    //     'http://localhost:3000' :
    //     join(__dirname, '../../index.html')
    // );
}


// Handle IPC events from the renderer process to initialize the MatchTracker

const tracker = new MatchTracker();
tracker.on('*', (e) => {
  const { event, data } = e;
  if(!mainWindow) { return };
  mainWindow.webContents.send('tracker-event', { event, data});
})
ipcMain.on('invoke-tracker-method', async (_, data) => {
  const { seq, name, args } = JSON.parse(data) as { seq: number, name: keyof MatchTracker, args: any[] };
  const fn = async () => {
    try {
      if (tracker[name]) {
        if(!mainWindow) { return };
        const res = await (tracker[name] as any)(...args);
        mainWindow.webContents.send('invoke-tracker-method-response', { seq, payload: res });
      } else {
        throw new Error(`${String(name)} was not a method on the tracker object.`);
      }
    }  catch (err: any) {
      if(!mainWindow) { return };
      mainWindow.webContents.send('invoke-tracker-method-response', { seq: -seq, payload: err?.message || 'unknown error' });
    }
  }
  if(tracker.initializedDatabase) {
    fn();
  } else {
    tracker.once(TRACKER_EVENTS.INITIALIZED_DB, fn);
  }
});

tracker.initDb('./slippi-ops.db');

const isDev = process.env.npm_lifecycle_event === "dev" ? true : false;

async function handleFileOpen() {
    const { canceled, filePaths } = await dialog.showOpenDialog({ title: "Open File" })
    if (!canceled) {
        return filePaths[0]
    }
    return '';
}
  
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    ipcMain.handle('dialog:openFile', handleFileOpen)
    createWindow()
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
   // autoUpdater.checkForUpdates();
});

/*

autoUpdater.on("update-available", (info) => {
  console.log('update available');

  mainWindow.webContents.send('updater-event', { event: 'update-available', data: info });
})
autoUpdater.on("update-downloaded", () => {
  console.log('update downloaded');

  mainWindow.webContents.send('updater-event', { event: 'download-finished'});
})
autoUpdater.on("error", (err) => {
  console.error('update error', err);
  mainWindow.webContents.send('updater-event', { event: 'update-error ', data: err });
})
  */

/*
ipcMain.on('update-app', () => {
  console.log('update app start');
  autoUpdater.downloadUpdate();
  mainWindow.webContents.send('update-event', { event: 'download-started '});
});

ipcMain.on('update-cancel', () => {
  console.log('cancel update');
});
ipcMain.on('restart-app', () => {
  console.log('restart app');
});
*/
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});