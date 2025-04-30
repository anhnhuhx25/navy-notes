// Renderer process file for Electron integration
const { ipcRenderer, Menu, MenuItem } = require('electron');

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Listen for export notes command from the main process
  ipcRenderer.on('menu-export-notes', () => {
    // Get the current state from localStorage
    const appState = localStorage.getItem('navy-notes-state');
    if (appState) {
      // Send the data to the main process for export
      ipcRenderer.send('export-notes', appState);
    }
  });

  // Listen for imported notes data from the main process
  ipcRenderer.on('import-notes-data', (event, data) => {
    try {
      // Parse the imported data
      const importedState = JSON.parse(data);
      
      // Validate the structure of imported data
      if (importedState && importedState.notebooks && importedState.notes) {
        // Store the imported state in localStorage
        localStorage.setItem('navy-notes-state', data);
        
        // Save to file system as well
        ipcRenderer.send('save-app-data', data);
        
        // Reload the application to reflect imported data
        window.location.reload();
      } else {
        alert('Invalid import file structure. Import failed.');
      }
    } catch (err) {
      alert(`Error importing notes: ${err.message}`);
    }
  });

  // Listen for app quitting event to save data
  ipcRenderer.on('app-quitting', () => {
    const appState = localStorage.getItem('navy-notes-state');
    if (appState) {
      ipcRenderer.send('save-app-data', appState);
    }
  });

  // When the app starts, load saved data from file system
  ipcRenderer.send('load-app-data');
  
  // Handle the load data response
  ipcRenderer.on('load-app-data-response', (event, data) => {
    if (data) {
      // Store the data in localStorage
      localStorage.setItem('navy-notes-state', data);
      
      // Reload to use the loaded data
      window.location.reload();
    }
  });

  // Handle save data response
  ipcRenderer.on('save-app-data-response', (event, success) => {
    if (!success) {
      console.error('Failed to save data to file system');
    }
  });
  
  // Handle delete confirmation response
  ipcRenderer.on('delete-confirmation-response', (event, { confirmed }) => {
    const confirmEvent = new CustomEvent('delete-confirmation', {
      detail: { confirmed }
    });
    document.dispatchEvent(confirmEvent);
  });
  
  // Save data to file system periodically (every 30 seconds)
  setInterval(() => {
    const appState = localStorage.getItem('navy-notes-state');
    if (appState) {
      ipcRenderer.send('save-app-data', appState);
    }
  }, 30000);

  // Create and set up context menus
  setupContextMenus();
});

// Set up context menus for notebooks and notes
function setupContextMenus() {
  // Notebook context menu setup
  document.addEventListener('contextmenu', (e) => {
    const notebookItem = e.target.closest('.notebook');
    const noteItem = e.target.closest('.note');
    
    if (notebookItem) {
      e.preventDefault();
      const notebookId = notebookItem.getAttribute('data-id');
      const notebookName = notebookItem.querySelector('span').textContent;
      
      showNotebookContextMenu(notebookId, notebookName, e.x, e.y);
    } 
    else if (noteItem) {
      e.preventDefault();
      const noteId = noteItem.getAttribute('data-id');
      const noteTitle = noteItem.querySelector('.note-title').textContent;
      
      showNoteContextMenu(noteId, noteTitle, e.x, e.y);
    }
  });
}

// Show context menu for notebooks
function showNotebookContextMenu(notebookId, notebookName, x, y) {
  // Create a custom event to notify the application script
  const event = new CustomEvent('notebook-context-menu', {
    detail: {
      notebookId: notebookId,
      notebookName: notebookName,
      x: x,
      y: y
    }
  });
  document.dispatchEvent(event);
}

// Show context menu for notes
function showNoteContextMenu(noteId, noteTitle, x, y) {
  // Create a custom event to notify the application script
  const event = new CustomEvent('note-context-menu', {
    detail: {
      noteId: noteId,
      noteTitle: noteTitle,
      x: x,
      y: y
    }
  });
  document.dispatchEvent(event);
}

// Function to show delete confirmation dialog
window.showDeleteConfirmation = function(type, name) {
  ipcRenderer.send('show-delete-confirmation', { type, name });
  
  // Return a promise that resolves when the user makes a choice
  return new Promise((resolve) => {
    document.addEventListener('delete-confirmation', function handleConfirmation(e) {
      document.removeEventListener('delete-confirmation', handleConfirmation);
      resolve(e.detail.confirmed);
    });
  });
};