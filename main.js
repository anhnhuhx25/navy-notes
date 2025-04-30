// Electron main process file
const { app, BrowserWindow, Menu, dialog, ipcMain, ContextMenu, MenuItem } = require('electron');
const path = require('path');
const fs = require('fs');
const { saveDataToFile, loadDataFromFile } = require('./data-storage');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#001f3f', // Navy blue background
    webPreferences: {
      nodeIntegration: true, // Allow Node.js APIs in renderer
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'icon.ico') // You'll need to create an icon file
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Open DevTools in development mode
  // mainWindow.webContents.openDevTools();

  // Create the application menu
  createMenu();

  // Handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Notes',
          click: () => {
            mainWindow.webContents.send('menu-export-notes');
          }
        },
        {
          label: 'Import Notes',
          click: () => {
            importNotes();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Navy Notes',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'About Navy Notes',
              message: 'Navy Notes v1.0.0',
              detail: 'A note-taking application inspired by Microsoft OneNote.\n\n© 2025 Navy Notes',
              icon: path.join(__dirname, 'icon.ico')
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Handle importing notes
function importNotes() {
  dialog.showOpenDialog(mainWindow, {
    title: 'Import Notes',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        mainWindow.webContents.send('import-notes-data', data);
      } catch (err) {
        dialog.showErrorBox('Import Error', `Failed to import notes: ${err.message}`);
      }
    }
  }).catch(err => {
    dialog.showErrorBox('Import Error', `Failed to open file dialog: ${err.message}`);
  });
}

// Handle export notes
ipcMain.on('export-notes', (event, data) => {
  dialog.showSaveDialog(mainWindow, {
    title: 'Export Notes',
    defaultPath: 'navy-notes-export.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      try {
        fs.writeFileSync(result.filePath, data, 'utf8');
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Export Successful',
          message: 'Notes exported successfully!'
        });
      } catch (err) {
        dialog.showErrorBox('Export Error', `Failed to export notes: ${err.message}`);
      }
    }
  }).catch(err => {
    dialog.showErrorBox('Export Error', `Failed to open save dialog: ${err.message}`);
  });
});

// Save app data when requested
ipcMain.on('save-app-data', (event, data) => {
  const success = saveDataToFile(data);
  event.reply('save-app-data-response', success);
});

// Load app data when requested
ipcMain.on('load-app-data', (event) => {
  const data = loadDataFromFile();
  event.reply('load-app-data-response', data);
});

// Handle delete confirmation dialog
ipcMain.on('show-delete-confirmation', (event, { type, name }) => {
  dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Cancel', 'Delete'],
    defaultId: 1,
    title: 'Confirm Delete',
    message: `Are you sure you want to delete the ${type} "${name}"?`,
    detail: 'This action cannot be undone.'
  }).then(result => {
    event.reply('delete-confirmation-response', {
      confirmed: result.response === 1 // 1 is the index of "Delete" button
    });
  });
});

// Save app data before quitting
app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.webContents.send('app-quitting');
  }
});

// Initialize app when ready
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Re-create window when dock icon is clicked on macOS
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});