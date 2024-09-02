// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { contextBridge, ipcRenderer } from 'electron'

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: any, text: any) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
});

contextBridge.exposeInMainWorld('electron', {
  revealFile: (path: string) => ipcRenderer.invoke('reveal-file', path),
  invokeTrackerMethod: (data: string) => {
    ipcRenderer.send('invoke-tracker-method', data);
  },
  getDownloadJson: (fileName?: string) => ipcRenderer.invoke('get-download-json', fileName),
  getDownloadFile: (fileName?: string) => ipcRenderer.invoke('get-download-file', fileName),
  getDownloadDirectory: () => ipcRenderer.invoke('get-download-directory'),
  selectDir: () => ipcRenderer.invoke('select-dir'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectJson: () => ipcRenderer.invoke('select-json'),
  restartApp: () => ipcRenderer.send('restart-app'),
  cancelUpdate: () => ipcRenderer.send('update-cancel'),
  startUpdate: () => ipcRenderer.send('update-app'),
  editMatch: (data: string) => ipcRenderer.send('edit-match', data),
  onUpdaterEvent: (callback: any) => ipcRenderer.on('updater-event', (_, data) => callback(data)),
  onTrackerEvent: (callback: (d: { event: string, data: any }) => void) => ipcRenderer.on('tracker-event', (_, data) => callback(data)),
  onTrackerResponse: (callback: any) => ipcRenderer.on('invoke-tracker-method-response', (_, data) => callback(data)),
  onDbImportEvent: (callback: (d: { event: string, data: any }) => void) => ipcRenderer.on('db-import-event', (_, data) => callback(data))
})