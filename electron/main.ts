import { app, shell, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDb } from './db'
import { registerSessionHandlers } from './ipc/session'
import { registerStatsHandlers } from './ipc/stats'
import { registerSubjectHandlers } from './ipc/subject'
import { registerGoalHandlers } from './ipc/goal'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let savedBounds: Electron.Rectangle | null = null

function getIconPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'icon.png')
  }

  return join(__dirname, '../../resources/icon.png')
}

function createTray(): void {
  try {
    const icon = nativeImage.createFromPath(getIconPath())
    const trayIcon = process.platform === 'darwin' ? icon.resize({ width: 18, height: 18 }) : icon

    tray = new Tray(trayIcon)
    tray.setToolTip('Study Timer')

    const menu = Menu.buildFromTemplate([
      {
        label: '열기',
        click: () => {
          mainWindow?.show()
          mainWindow?.focus()
        }
      },
      { type: 'separator' },
      { label: '종료', click: () => app.quit() }
    ])
    tray.setContextMenu(menu)

    tray.on('click', () => {
      if (mainWindow?.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow?.show()
        mainWindow?.focus()
      }
    })
  } catch (e) {
    console.warn('Tray creation failed:', e)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    backgroundColor: '#1a1a2e',
    icon: getIconPath(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('close', (event) => {
    if (tray && !isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.study-timer')

  if (process.platform === 'darwin') {
    app.dock.setIcon(getIconPath())
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initDb()
  registerSessionHandlers()
  registerStatsHandlers()
  registerSubjectHandlers()
  registerGoalHandlers()

  ipcMain.handle('window:setCompact', (_event, compact: boolean) => {
    if (!mainWindow) return
    if (compact) {
      savedBounds = mainWindow.getBounds()
      mainWindow.setMinimumSize(1, 1)
      mainWindow.setSize(300, 52)
      mainWindow.setAlwaysOnTop(true, 'floating')
      mainWindow.setResizable(false)
    } else {
      mainWindow.setAlwaysOnTop(false)
      mainWindow.setResizable(true)
      mainWindow.setMinimumSize(1, 1)
      if (savedBounds) {
        mainWindow.setBounds(savedBounds)
        savedBounds = null
      } else {
        mainWindow.setSize(900, 670)
      }
    }
  })

  createWindow()
  createTray()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else mainWindow?.show()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  tray?.destroy()
  tray = null
})
