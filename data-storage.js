// Data storage utilities for Navy Notes
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Get the path to the user data directory
const getUserDataPath = () => {
  return app.getPath('userData');
};

// Get the full path to the data file
const getDataFilePath = () => {
  return path.join(getUserDataPath(), 'navy-notes-data.json');
};

// Save the application data to file
const saveDataToFile = (data) => {
  try {
    // Create the userData directory if it doesn't exist
    const userDataPath = getUserDataPath();
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    // Write the data to the file
    fs.writeFileSync(getDataFilePath(), data, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving data to file:', error);
    return false;
  }
};

// Load the application data from file
const loadDataFromFile = () => {
  try {
    // Check if the data file exists
    const dataFilePath = getDataFilePath();
    if (!fs.existsSync(dataFilePath)) {
      return null;
    }

    // Read and return the data
    return fs.readFileSync(dataFilePath, 'utf8');
  } catch (error) {
    console.error('Error loading data from file:', error);
    return null;
  }
};

module.exports = {
  saveDataToFile,
  loadDataFromFile,
  getUserDataPath,
  getDataFilePath
};