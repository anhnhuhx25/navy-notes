// Navy Notes - JavaScript functionality

// Wait for the DOM to be fully loaded before running any code
document.addEventListener('DOMContentLoaded', () => {
    // App state
    const state = {
        notebooks: [
            { id: 'notebook-1', name: 'Work', active: true },
            { id: 'notebook-2', name: 'Personal', active: false },
            { id: 'notebook-3', name: 'Project Ideas', active: false }
        ],
        notes: {
            'notebook-1': [
                { 
                    id: 'note-1', 
                    title: 'Meeting Notes', 
                    content: document.getElementById('editor-content').innerHTML,
                    preview: 'Team sync discussion about Q3 goals and priorities...',
                    date: 'Apr 30, 2025',
                    active: true
                },
                { 
                    id: 'note-2', 
                    title: 'Project Timeline', 
                    content: '<h2>Project Timeline - Q3 2025</h2><p>This document outlines key milestones for our upcoming launch.</p><h3>Phase 1: Planning (May)</h3><ul><li>Requirements gathering</li><li>User research</li><li>Design mockups</li></ul><h3>Phase 2: Development (June)</h3><ul><li>Frontend implementation</li><li>Backend development</li><li>API integration</li></ul><h3>Phase 3: Testing (July)</h3><ul><li>QA testing</li><li>User acceptance testing</li><li>Performance optimization</li></ul><h3>Phase 4: Launch (August)</h3><ul><li>Marketing campaign</li><li>Staged rollout</li><li>Monitoring & support</li></ul>',
                    preview: 'Key milestones for the upcoming project launch...',
                    date: 'Apr 29, 2025',
                    active: false
                },
                { 
                    id: 'note-3', 
                    title: 'Ideas', 
                    content: '<h2>Product Improvement Ideas</h2><p>A collection of ideas for future improvements.</p><h3>Feature Ideas:</h3><ul><li>Dark mode support</li><li>Offline access</li><li>Collaboration features</li><li>Mobile app enhancements</li><li>Integration with third-party tools</li></ul><h3>UI/UX Improvements:</h3><ul><li>Simplified navigation</li><li>Better onboarding flow</li><li>More customization options</li><li>Accessibility improvements</li></ul>',
                    preview: 'Brainstorming session for new features and improvements...',
                    date: 'Apr 28, 2025',
                    active: false
                }
            ],
            'notebook-2': [],
            'notebook-3': []
        },
        currentNotebook: 'notebook-1',
        currentNote: 'note-1',
        lastSaved: new Date(),
        hidden: {
            notebooks: [],
            notes: {}
        },
        uiLock: false // Add UI lock to prevent rapid switching
    };

    // DOM Elements
    const notebooksList = document.getElementById('notebooks-list');
    const notesList = document.getElementById('notes-list');
    const editorContent = document.getElementById('editor-content');
    const noteTitleInput = document.getElementById('current-note-title');
    const saveStatus = document.getElementById('save-status');
    const addNotebookBtn = document.getElementById('add-notebook-btn');
    const addNoteBtn = document.getElementById('add-note-btn');
    const newNotebookModal = document.getElementById('new-notebook-modal');
    const newNoteModal = document.getElementById('new-note-modal');
    const createNotebookBtn = document.getElementById('create-notebook-btn');
    const createNoteBtn = document.getElementById('create-note-btn');
    const notebookNameInput = document.getElementById('notebook-name');
    const noteTitleModalInput = document.getElementById('note-title');
    const formatButtons = document.querySelectorAll('.toolbar-btn');

    // Debounce flags to prevent rapid switching/multiple operations
    let notebookSwitchTimeout = null;
    let noteSwitchTimeout = null;
    const debounceDelay = 300; // milliseconds

    // Initialize rich text editor
    initEditor();

    // Set up event listeners
    setupEventListeners();

    // Initialize modals
    initModals();

    /**
     * Initialize the rich text editor functionality
     */
    function initEditor() {
        // Focus the editor
        editorContent.focus();

        // Set up formatting buttons
        formatButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Skip if UI is locked
                if (state.uiLock) return;
                
                const command = button.getAttribute('data-command');
                
                if (command === 'createLink') {
                    const url = prompt('Enter the link URL:');
                    if (url) document.execCommand(command, false, url);
                } else if (command === 'insertImage') {
                    const url = prompt('Enter the image URL:');
                    if (url) document.execCommand(command, false, url);
                } else {
                    document.execCommand(command, false, null);
                }
                
                // Update active state for the button
                if (['bold', 'italic', 'underline', 'strikeThrough', 
                     'justifyLeft', 'justifyCenter', 'justifyRight',
                     'insertUnorderedList', 'insertOrderedList'].includes(command)) {
                    button.classList.toggle('active');
                }
                
                // Save after formatting
                saveCurrentNote();
            });
        });

        // Auto-save when content changes - debounced to prevent rapid saves
        editorContent.addEventListener('input', debounce(() => {
            if (!state.uiLock) {
                saveCurrentNote();
            }
        }, 1000));

        // Auto-save when title changes - debounced to prevent rapid saves
        noteTitleInput.addEventListener('input', debounce(() => {
            if (!state.uiLock) {
                saveCurrentNote();
            }
        }, 1000));
    }

    /**
     * Set up all event listeners for the application
     */
    function setupEventListeners() {
        // Notebook click events with debounce to prevent multiple selections
        notebooksList.addEventListener('click', (e) => {
            if (state.uiLock) return;
            
            const notebook = e.target.closest('.notebook');
            if (notebook) {
                const notebookId = notebook.getAttribute('data-id');
                
                // Skip if it's the current notebook or switching is in progress
                if (notebookId === state.currentNotebook || notebookSwitchTimeout) return;
                
                // Set UI lock during switching
                state.uiLock = true;
                
                // Clear any existing timeout
                if (notebookSwitchTimeout) {
                    clearTimeout(notebookSwitchTimeout);
                }
                
                // Create a new timeout for switching
                notebookSwitchTimeout = setTimeout(() => {
                    selectNotebook(notebookId);
                    notebookSwitchTimeout = null;
                    state.uiLock = false;
                }, debounceDelay);
            }
        });

        // Note click events with debounce
        notesList.addEventListener('click', (e) => {
            if (state.uiLock) return;
            
            const note = e.target.closest('.note');
            if (note) {
                const noteId = note.getAttribute('data-id');
                
                // Skip if it's the current note or switching is in progress
                if (noteId === state.currentNote || noteSwitchTimeout) return;
                
                // Set UI lock during switching
                state.uiLock = true;
                
                // Clear any existing timeout
                if (noteSwitchTimeout) {
                    clearTimeout(noteSwitchTimeout);
                }
                
                // Create a new timeout for switching
                noteSwitchTimeout = setTimeout(() => {
                    selectNote(noteId);
                    noteSwitchTimeout = null;
                    state.uiLock = false;
                }, debounceDelay);
            }
        });

        // Modal events
        addNotebookBtn.addEventListener('click', () => {
            if (state.uiLock) return;
            showModal(newNotebookModal);
            notebookNameInput.focus();
        });

        addNoteBtn.addEventListener('click', () => {
            if (state.uiLock) return;
            showModal(newNoteModal);
            noteTitleModalInput.focus();
        });

        // Close modals when clicking the X or cancel buttons
        document.querySelectorAll('.close-modal, .cancel-btn').forEach(element => {
            element.addEventListener('click', (e) => {
                if (state.uiLock) return;
                const modal = e.target.closest('.modal');
                hideModal(modal);
            });
        });

        // Create notebook button
        createNotebookBtn.addEventListener('click', () => {
            if (state.uiLock) return;
            createNewNotebook();
        });

        // Create note button
        createNoteBtn.addEventListener('click', () => {
            if (state.uiLock) return;
            createNewNote();
        });

        // Close modal on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (state.uiLock) return;
                if (e.target === modal) {
                    hideModal(modal);
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (state.uiLock) return;
            
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveCurrentNote();
            }
        });

        // Context menu events
        document.addEventListener('notebook-context-menu', (e) => {
            if (state.uiLock) return;
            
            const { notebookId, notebookName, x, y } = e.detail;
            showContextMenu('notebook', { id: notebookId, name: notebookName }, x, y);
        });

        document.addEventListener('note-context-menu', (e) => {
            if (state.uiLock) return;
            
            const { noteId, noteTitle, x, y } = e.detail;
            showContextMenu('note', { id: noteId, name: noteTitle }, x, y);
        });

        // Click outside context menu to close it
        document.addEventListener('click', () => {
            if (state.uiLock) return;
            
            const contextMenu = document.querySelector('.custom-context-menu');
            if (contextMenu) {
                contextMenu.remove();
            }
        });
    }

    /**
     * Initialize modal functionality
     */
    function initModals() {
        // Enter key in modals
        notebookNameInput.addEventListener('keydown', (e) => {
            if (state.uiLock) return;
            if (e.key === 'Enter') {
                createNewNotebook();
            }
        });

        noteTitleModalInput.addEventListener('keydown', (e) => {
            if (state.uiLock) return;
            if (e.key === 'Enter') {
                createNewNote();
            }
        });
    }

    /**
     * Select a notebook and display its notes
     * @param {string} notebookId - The ID of the notebook to select
     */
    function selectNotebook(notebookId) {
        // First save current note
        saveCurrentNote();
        
        // Update state
        state.currentNotebook = notebookId;
        
        // Update notebooks UI
        state.notebooks.forEach(notebook => {
            notebook.active = notebook.id === notebookId;
        });
        
        updateNotebooksUI();
        
        // Load notes for the selected notebook
        loadNotesForNotebook(notebookId);
        
        // Select the first note if available
        const notes = state.notes[notebookId];
        if (notes && notes.length > 0) {
            selectNote(notes[0].id);
        } else {
            // Clear editor if no notes
            clearEditor();
        }
    }

    /**
     * Select a note and display its content in the editor
     * @param {string} noteId - The ID of the note to select
     */
    function selectNote(noteId) {
        // Skip if the note is already selected
        if (state.currentNote === noteId) return;
        
        const notes = state.notes[state.currentNotebook];
        
        // Find the note
        const note = notes.find(note => note.id === noteId);
        if (!note) return;
        
        // Update state
        state.currentNote = noteId;
        
        // Update active state in notes
        notes.forEach(note => {
            note.active = note.id === noteId;
        });
        
        // Update notes UI
        updateNotesUI();
        
        // Load note content
        editorContent.innerHTML = note.content;
        noteTitleInput.value = note.title;
    }

    /**
     * Update the notebooks UI based on current state
     */
    function updateNotebooksUI() {
        // Clear the current notebooks
        notebooksList.innerHTML = '';
        
        // Add notebooks from state
        state.notebooks.forEach(notebook => {
            const notebookElement = document.createElement('li');
            notebookElement.className = `notebook ${notebook.active ? 'active' : ''}`;
            notebookElement.setAttribute('data-id', notebook.id);
            
            notebookElement.innerHTML = `
                <i class="fas fa-book"></i>
                <span>${notebook.name}</span>
                <i class="fas fa-ellipsis-v context-indicator"></i>
            `;
            
            notebooksList.appendChild(notebookElement);
        });
    }

    /**
     * Update the notes UI based on current state
     */
    function updateNotesUI() {
        // Clear the current notes
        notesList.innerHTML = '';
        
        // Add notes from current notebook
        const notes = state.notes[state.currentNotebook] || [];
        
        notes.forEach(note => {
            const noteElement = document.createElement('li');
            noteElement.className = `note ${note.active ? 'active' : ''}`;
            noteElement.setAttribute('data-id', note.id);
            
            noteElement.innerHTML = `
                <div class="note-title">${note.title}</div>
                <div class="note-preview">${note.preview}</div>
                <div class="note-date">${note.date}</div>
                <i class="fas fa-ellipsis-v context-indicator"></i>
            `;
            
            notesList.appendChild(noteElement);
        });
    }

    /**
     * Load notes for a specific notebook
     * @param {string} notebookId - The ID of the notebook
     */
    function loadNotesForNotebook(notebookId) {
        if (!state.notes[notebookId]) {
            state.notes[notebookId] = [];
        }
        
        updateNotesUI();
    }

    /**
     * Save the current note
     */
    function saveCurrentNote() {
        const currentNotebookId = state.currentNotebook;
        const currentNoteId = state.currentNote;
        
        if (!currentNotebookId || !currentNoteId) return;
        
        const notes = state.notes[currentNotebookId];
        const noteIndex = notes.findIndex(note => note.id === currentNoteId);
        
        if (noteIndex === -1) return;
        
        // Get current content and title
        const content = editorContent.innerHTML;
        const title = noteTitleInput.value;
        
        // Generate preview from content (strip tags and limit length)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const preview = tempDiv.textContent.trim().substring(0, 60) + '...';
        
        // Update note in state
        notes[noteIndex].content = content;
        notes[noteIndex].title = title;
        notes[noteIndex].preview = preview;
        notes[noteIndex].date = formatDate(new Date());
        
        // Update UI
        updateNotesUI();
        
        // Update save status
        state.lastSaved = new Date();
        updateSaveStatus();
        
        // Save to localStorage
        saveStateToStorage();
    }

    /**
     * Create a new notebook
     */
    function createNewNotebook() {
        // Lock UI during operation
        if (state.uiLock) return;
        state.uiLock = true;
        
        const name = notebookNameInput.value.trim();
        
        if (!name) {
            alert('Please enter a notebook name');
            state.uiLock = false;
            return;
        }
        
        try {
            // Create new notebook ID
            const id = 'notebook-' + Date.now();
            
            // Add to state
            state.notebooks.push({
                id,
                name,
                active: false
            });
            
            // Initialize empty notes array for this notebook
            state.notes[id] = [];
            
            // Reset input and hide modal
            notebookNameInput.value = '';
            hideModal(newNotebookModal);
            
            // Update UI
            updateNotebooksUI();
            
            // Select the new notebook
            selectNotebook(id);
            
            // Save to localStorage
            saveStateToStorage();
        } catch (error) {
            console.error('Error creating notebook:', error);
        } finally {
            // Unlock UI after operation completes
            setTimeout(() => {
                state.uiLock = false;
            }, debounceDelay);
        }
    }

    /**
     * Create a new note in the current notebook
     */
    function createNewNote() {
        // Lock UI during operation
        if (state.uiLock) return;
        state.uiLock = true;
        
        const title = noteTitleModalInput.value.trim();
        
        if (!title) {
            alert('Please enter a note title');
            state.uiLock = false;
            return;
        }
        
        // Get current notebook
        const notebookId = state.currentNotebook;
        
        if (!notebookId) {
            state.uiLock = false;
            return;
        }
        
        try {
            // Create new note ID
            const id = 'note-' + Date.now();
            
            // Create empty note content
            const content = '<h2>' + title + '</h2><p>Start typing your note here...</p>';
            
            // Add to state
            const notes = state.notes[notebookId];
            
            // Set all notes to inactive
            notes.forEach(note => {
                note.active = false;
            });
            
            // Add the new note
            notes.unshift({
                id,
                title,
                content,
                preview: 'Start typing your note here...',
                date: formatDate(new Date()),
                active: true
            });
            
            // Update state
            state.currentNote = id;
            
            // Reset input and hide modal
            noteTitleModalInput.value = '';
            hideModal(newNoteModal);
            
            // Update UI
            updateNotesUI();
            
            // Load the new note in the editor
            editorContent.innerHTML = content;
            noteTitleInput.value = title;
            
            // Focus the editor
            editorContent.focus();
            
            // Save to localStorage
            saveStateToStorage();
        } catch (error) {
            console.error('Error creating note:', error);
        } finally {
            // Unlock UI after operation completes
            setTimeout(() => {
                state.uiLock = false;
            }, debounceDelay);
        }
    }

    /**
     * Delete a notebook
     * @param {string} notebookId - The ID of the notebook to delete
     */
    async function deleteNotebook(notebookId) {
        // Lock UI during operation
        if (state.uiLock) return;
        state.uiLock = true;
        
        try {
            // Find the notebook to get its name
            const notebook = state.notebooks.find(nb => nb.id === notebookId);
            if (!notebook) {
                state.uiLock = false;
                return;
            }

            // Show confirmation dialog
            const isConfirmed = await window.showDeleteConfirmation('notebook', notebook.name);
            
            if (isConfirmed) {
                // Remove the notebook from state
                state.notebooks = state.notebooks.filter(nb => nb.id !== notebookId);
                
                // Remove its notes
                delete state.notes[notebookId];
                
                // If the deleted notebook was active, select another one
                if (state.currentNotebook === notebookId) {
                    if (state.notebooks.length > 0) {
                        selectNotebook(state.notebooks[0].id);
                    } else {
                        // No notebooks left
                        state.currentNotebook = null;
                        state.currentNote = null;
                        clearEditor();
                    }
                }
                
                // Update UI
                updateNotebooksUI();
                
                // Save to localStorage
                saveStateToStorage();
            }
        } catch (error) {
            console.error('Error deleting notebook:', error);
        } finally {
            // Unlock UI after operation completes
            setTimeout(() => {
                state.uiLock = false;
            }, debounceDelay);
        }
    }

    /**
     * Hide a notebook (doesn't delete it)
     * @param {string} notebookId - The ID of the notebook to hide
     */
    function hideNotebook(notebookId) {
        // Lock UI during operation
        if (state.uiLock) return;
        state.uiLock = true;
        
        try {
            // Find the notebook
            const notebook = state.notebooks.find(nb => nb.id === notebookId);
            if (!notebook) {
                state.uiLock = false;
                return;
            }
            
            // Add to hidden list
            state.hidden.notebooks.push(notebookId);
            
            // Remove from visible notebooks
            state.notebooks = state.notebooks.filter(nb => nb.id !== notebookId);
            
            // If the hidden notebook was active, select another one
            if (state.currentNotebook === notebookId) {
                if (state.notebooks.length > 0) {
                    selectNotebook(state.notebooks[0].id);
                } else {
                    // No notebooks left
                    state.currentNotebook = null;
                    state.currentNote = null;
                    clearEditor();
                }
            }
            
            // Update UI
            updateNotebooksUI();
            
            // Save to localStorage
            saveStateToStorage();
        } catch (error) {
            console.error('Error hiding notebook:', error);
        } finally {
            // Unlock UI after operation completes
            setTimeout(() => {
                state.uiLock = false;
            }, debounceDelay);
        }
    }

    /**
     * Delete a note
     * @param {string} noteId - The ID of the note to delete
     */
    async function deleteNote(noteId) {
        // Lock UI during operation
        if (state.uiLock) return;
        state.uiLock = true;
        
        try {
            const notebookId = state.currentNotebook;
            if (!notebookId) {
                state.uiLock = false;
                return;
            }
            
            // Find the note
            const notes = state.notes[notebookId];
            const note = notes.find(n => n.id === noteId);
            if (!note) {
                state.uiLock = false;
                return;
            }

            // Show confirmation dialog
            const isConfirmed = await window.showDeleteConfirmation('note', note.title);
            
            if (isConfirmed) {
                // Remove the note
                state.notes[notebookId] = notes.filter(n => n.id !== noteId);
                
                // If the deleted note was active, select another one
                if (state.currentNote === noteId) {
                    if (state.notes[notebookId].length > 0) {
                        selectNote(state.notes[notebookId][0].id);
                    } else {
                        // No notes left in this notebook
                        state.currentNote = null;
                        clearEditor();
                    }
                }
                
                // Update UI
                updateNotesUI();
                
                // Save to localStorage
                saveStateToStorage();
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        } finally {
            // Unlock UI after operation completes
            setTimeout(() => {
                state.uiLock = false;
            }, debounceDelay);
        }
    }

    /**
     * Hide a note (doesn't delete it)
     * @param {string} noteId - The ID of the note to hide
     */
    function hideNote(noteId) {
        // Lock UI during operation
        if (state.uiLock) return;
        state.uiLock = true;
        
        try {
            const notebookId = state.currentNotebook;
            if (!notebookId) {
                state.uiLock = false;
                return;
            }
            
            // Find the note
            const notes = state.notes[notebookId];
            const note = notes.find(n => n.id === noteId);
            if (!note) {
                state.uiLock = false;
                return;
            }
            
            // Initialize hidden notes array for this notebook if it doesn't exist
            if (!state.hidden.notes[notebookId]) {
                state.hidden.notes[notebookId] = [];
            }
            
            // Add to hidden list
            state.hidden.notes[notebookId].push({...note});
            
            // Remove from visible notes
            state.notes[notebookId] = notes.filter(n => n.id !== noteId);
            
            // If the hidden note was active, select another one
            if (state.currentNote === noteId) {
                if (state.notes[notebookId].length > 0) {
                    selectNote(state.notes[notebookId][0].id);
                } else {
                    // No notes left in this notebook
                    state.currentNote = null;
                    clearEditor();
                }
            }
            
            // Update UI
            updateNotesUI();
            
            // Save to localStorage
            saveStateToStorage();
        } catch (error) {
            console.error('Error hiding note:', error);
        } finally {
            // Unlock UI after operation completes
            setTimeout(() => {
                state.uiLock = false;
            }, debounceDelay);
        }
    }

    /**
     * Show a context menu for notebooks or notes
     * @param {string} type - The type of item ('notebook' or 'note')
     * @param {object} item - The item data (id and name)
     * @param {number} x - The x position for the menu
     * @param {number} y - The y position for the menu
     */
    function showContextMenu(type, item, x, y) {
        // Lock UI during operation
        if (state.uiLock) return;
        state.uiLock = true;
        
        try {
            // Remove any existing context menu
            const existingMenu = document.querySelector('.custom-context-menu');
            if (existingMenu) {
                existingMenu.remove();
            }
            
            // Create context menu element
            const contextMenu = document.createElement('div');
            contextMenu.className = 'custom-context-menu';
            
            // Add menu items based on type
            if (type === 'notebook') {
                contextMenu.innerHTML = `
                    <div class="context-menu-item hide-item">
                        <i class="fas fa-eye-slash"></i>
                        <span>Hide Notebook</span>
                    </div>
                    <div class="context-menu-separator"></div>
                    <div class="context-menu-item delete delete-item">
                        <i class="fas fa-trash-alt"></i>
                        <span>Delete Notebook</span>
                    </div>
                `;
                
                // Set up event listeners for notebook context menu
                contextMenu.querySelector('.hide-item').addEventListener('click', () => {
                    hideNotebook(item.id);
                    contextMenu.remove();
                });
                
                contextMenu.querySelector('.delete-item').addEventListener('click', () => {
                    deleteNotebook(item.id);
                    contextMenu.remove();
                });
            } else if (type === 'note') {
                contextMenu.innerHTML = `
                    <div class="context-menu-item hide-item">
                        <i class="fas fa-eye-slash"></i>
                        <span>Hide Note</span>
                    </div>
                    <div class="context-menu-separator"></div>
                    <div class="context-menu-item delete delete-item">
                        <i class="fas fa-trash-alt"></i>
                        <span>Delete Note</span>
                    </div>
                `;
                
                // Set up event listeners for note context menu
                contextMenu.querySelector('.hide-item').addEventListener('click', () => {
                    hideNote(item.id);
                    contextMenu.remove();
                });
                
                contextMenu.querySelector('.delete-item').addEventListener('click', () => {
                    deleteNote(item.id);
                    contextMenu.remove();
                });
            }
            
            // Position the menu
            contextMenu.style.left = `${x}px`;
            contextMenu.style.top = `${y}px`;
            
            // Add to DOM
            document.body.appendChild(contextMenu);
            
            // Prevent menu from going off-screen
            const menuRect = contextMenu.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            if (menuRect.right > windowWidth) {
                contextMenu.style.left = `${windowWidth - menuRect.width - 10}px`;
            }
            
            if (menuRect.bottom > windowHeight) {
                contextMenu.style.top = `${windowHeight - menuRect.height - 10}px`;
            }
        } catch (error) {
            console.error('Error showing context menu:', error);
        } finally {
            // Unlock UI after menu is shown
            setTimeout(() => {
                state.uiLock = false;
            }, 100);
        }
    }

    /**
     * Clear the editor
     */
    function clearEditor() {
        editorContent.innerHTML = '';
        noteTitleInput.value = '';
    }

    /**
     * Show a modal
     * @param {HTMLElement} modal - The modal element to show
     */
    function showModal(modal) {
        modal.classList.add('show');
    }

    /**
     * Hide a modal
     * @param {HTMLElement} modal - The modal element to hide
     */
    function hideModal(modal) {
        modal.classList.remove('show');
    }

    /**
     * Update the save status text
     */
    function updateSaveStatus() {
        saveStatus.textContent = 'All changes saved';
        
        // Briefly show the save message
        saveStatus.style.opacity = '1';
        setTimeout(() => {
            saveStatus.style.opacity = '0.7';
        }, 2000);
    }

    /**
     * Save the current state to localStorage
     */
    function saveStateToStorage() {
        try {
            localStorage.setItem('navy-notes-state', JSON.stringify(state));
            
            // If we're in an Electron environment and ipcRenderer is available
            if (typeof ipcRenderer !== 'undefined') {
                ipcRenderer.send('save-app-data', JSON.stringify(state));
            }
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    /**
     * Format a date object to a readable string
     * @param {Date} date - The date to format
     * @returns {string} The formatted date string
     */
    function formatDate(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    /**
     * Debounce function to limit how often a function is called
     * @param {Function} func - The function to debounce
     * @param {number} wait - The time to wait in milliseconds
     * @returns {Function} The debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Emergency reset function - accessible from console
    window.resetNavyNotes = function() {
        localStorage.removeItem('navy-notes-state');
        window.location.reload();
    };

    // Store data in localStorage before unload
    window.addEventListener('beforeunload', () => {
        if (!state.uiLock) {
            try {
                saveCurrentNote();
                saveStateToStorage();
            } catch (error) {
                console.error('Error during beforeunload:', error);
            }
        }
    });

    // Load data from localStorage on page load
    try {
        const savedState = localStorage.getItem('navy-notes-state');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                Object.assign(state, parsedState);

                // Make sure uiLock is false when loading
                state.uiLock = false;
                
                updateNotebooksUI();
                updateNotesUI();
                
                // Load the active note
                const currentNotebookId = state.currentNotebook;
                const currentNoteId = state.currentNote;
                
                if (currentNotebookId && currentNoteId) {
                    const notes = state.notes[currentNotebookId] || [];
                    const note = notes.find(note => note.id === currentNoteId);
                    
                    if (note) {
                        editorContent.innerHTML = note.content;
                        noteTitleInput.value = note.title;
                    }
                }
            } catch (error) {
                console.error('Error parsing saved state:', error);
                // Reset to default state on error
                localStorage.removeItem('navy-notes-state');
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }
        }
    } catch (error) {
        console.error('Error loading saved state:', error);
    }

    // Expose functions globally if we want to access them from DevTools
    window.appState = state;
});