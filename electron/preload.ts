import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  session: {
    create: (payload: unknown) => ipcRenderer.invoke('session:create', payload),
    pause: (payload: unknown) => ipcRenderer.invoke('session:pause', payload),
    resume: (payload: unknown) => ipcRenderer.invoke('session:resume', payload),
    finish: (payload: unknown) => ipcRenderer.invoke('session:finish', payload),
    list: (payload: unknown) => ipcRenderer.invoke('session:list', payload),
    findUnfinished: () => ipcRenderer.invoke('session:findUnfinished'),
    discard: (payload: unknown) => ipcRenderer.invoke('session:discard', payload),
    updateMemo: (payload: unknown) => ipcRenderer.invoke('session:updateMemo', payload),
    delete: (payload: unknown) => ipcRenderer.invoke('session:delete', payload),
    listFinished: (payload: unknown) => ipcRenderer.invoke('session:listFinished', payload)
  },
  stats: {
    daily: (payload: unknown) => ipcRenderer.invoke('stats:daily', payload),
    subjectTotal: (payload: unknown) => ipcRenderer.invoke('stats:subjectTotal', payload),
    dailyForSubject: (payload: unknown) => ipcRenderer.invoke('stats:dailyForSubject', payload),
    weekly: (payload: unknown) => ipcRenderer.invoke('stats:weekly', payload),
    weeklyBySubject: (payload: unknown) => ipcRenderer.invoke('stats:weeklyBySubject', payload),
    monthly: (payload: unknown) => ipcRenderer.invoke('stats:monthly', payload)
  },
  subject: {
    list: () => ipcRenderer.invoke('subject:list'),
    create: (payload: unknown) => ipcRenderer.invoke('subject:create', payload),
    update: (payload: unknown) => ipcRenderer.invoke('subject:update', payload),
    delete: (payload: unknown) => ipcRenderer.invoke('subject:delete', payload)
  },
  goal: {
    list: () => ipcRenderer.invoke('goal:list'),
    upsert: (payload: unknown) => ipcRenderer.invoke('goal:upsert', payload)
  },
  window: {
    setCompact: (compact: boolean) => ipcRenderer.invoke('window:setCompact', compact)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
