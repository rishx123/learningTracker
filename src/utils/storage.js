// src/utils/storage.js
const STORAGE_KEY = 'learningTrackerData';

export const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('✅ Data saved to localStorage');
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = () => {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (item) {
      const data = JSON.parse(item);
      console.log('✅ Data loaded from localStorage');
      return data;
    }
    return null;
  } catch (error) {
    console.error('❌ Error loading from localStorage:', error);
    return null;
  }
};

export const clearLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ localStorage cleared');
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
};

// Export/Import functionality for backup
export const exportData = () => {
  const data = loadFromLocalStorage();
  if (data) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `learning-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        saveToLocalStorage(data);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });
};