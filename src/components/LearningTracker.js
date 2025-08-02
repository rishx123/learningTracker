import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Target, TrendingUp, Plus, Edit3, X, Download, Upload, Trash2 } from 'lucide-react';
import { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage, exportData, importData } from '../utils/storage';

const LearningTracker = () => {
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [showNewChallenge, setShowNewChallenge] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Date utility functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDateForDay = (startDate, dayNumber) => {
    const start = new Date(startDate);
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + (dayNumber - 1));
    return targetDate.toISOString().split('T')[0];
  };

  const getDayNumberFromDate = (startDate, targetDate) => {
    const start = new Date(startDate);
    const target = new Date(targetDate);
    const diffTime = target - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const isDateInPast = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return today.toDateString() === date.toDateString();
  };

  const isDateInFuture = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData && savedData.challenges) {
      setChallenges(savedData.challenges);
      
      // Set active challenge (prefer incomplete challenge or last one)
      const incompleteChallenge = savedData.challenges.find(c => !c.completed);
      const lastChallenge = savedData.challenges[savedData.challenges.length - 1];
      setActiveChallenge(incompleteChallenge || lastChallenge);
    }
  }, []);

  // Save data to localStorage whenever challenges change
  useEffect(() => {
    if (challenges.length > 0) {
      const dataToSave = {
        challenges,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      saveToLocalStorage(dataToSave);
    }
  }, [challenges]);

  const createChallenge = (title, days, description, startDate) => {
    const newChallenge = {
      id: Date.now(),
      title,
      totalDays: parseInt(days),
      description,
      startDate: startDate || new Date().toISOString().split('T')[0],
      entries: {},
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    const updated = [...challenges, newChallenge];
    setChallenges(updated);
    setActiveChallenge(newChallenge);
    setShowNewChallenge(false);
  };

  const addEntry = (challengeId, day, content) => {
    setChallenges(prev => {
      const updated = prev.map(challenge => 
        challenge.id === challengeId 
          ? { 
              ...challenge, 
              entries: { ...challenge.entries, [day]: content }
            }
          : challenge
      );
      
      // Update active challenge if it's the one being modified
      const updatedChallenge = updated.find(c => c.id === challengeId);
      if (activeChallenge?.id === challengeId) {
        setActiveChallenge(updatedChallenge);
      }
      
      return updated;
    });
  };

  const deleteEntry = (challengeId, day) => {
    setChallenges(prev => {
      const updated = prev.map(challenge => 
        challenge.id === challengeId 
          ? { 
              ...challenge, 
              entries: Object.fromEntries(
                Object.entries(challenge.entries).filter(([k]) => k !== day.toString())
              )
            }
          : challenge
      );
      
      // Update active challenge if it's the one being modified
      const updatedChallenge = updated.find(c => c.id === challengeId);
      if (activeChallenge?.id === challengeId) {
        setActiveChallenge(updatedChallenge);
      }
      
      return updated;
    });
  };

  const deleteChallenge = (challengeId) => {
    const updated = challenges.filter(c => c.id !== challengeId);
    setChallenges(updated);
    
    if (activeChallenge?.id === challengeId) {
      setActiveChallenge(updated.length > 0 ? updated[updated.length - 1] : null);
    }
  };

  const markChallengeComplete = (challengeId) => {
    setChallenges(prev => prev.map(challenge => 
      challenge.id === challengeId 
        ? { ...challenge, completed: true, completedDate: new Date().toISOString() }
        : challenge
    ));
  };

  const getCompletedDays = (challenge) => {
    return Object.keys(challenge.entries).length;
  };

  const getProgressPercentage = (challenge) => {
    return Math.round((getCompletedDays(challenge) / challenge.totalDays) * 100);
  };

  const getCurrentStreak = (challenge) => {
    const entries = Object.keys(challenge.entries).map(Number).sort((a, b) => b - a);
    let streak = 0;
    for (let i = 0; i < entries.length; i++) {
      if (i === 0 || entries[i-1] - entries[i] === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      importData(file)
        .then(data => {
          if (data.challenges) {
            setChallenges(data.challenges);
            const incompleteChallenge = data.challenges.find(c => !c.completed);
            setActiveChallenge(incompleteChallenge || data.challenges[data.challenges.length - 1]);
            alert('✅ Data imported successfully!');
          }
        })
        .catch(error => {
          console.error('Import error:', error);
          alert('❌ Error importing data. Please check the file format.');
        });
    }
    event.target.value = ''; // Reset file input
  };

  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Settings & Data</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📊 Data Summary</h3>
            <p className="text-blue-700 text-sm">
              Total Challenges: {challenges.length}<br/>
              Completed: {challenges.filter(c => c.completed).length}<br/>
              Active: {challenges.filter(c => !c.completed).length}
            </p>
          </div>
          
          <button
            onClick={exportData}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export Data (Backup)
          </button>
          
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              Import Data (Restore)
            </label>
          </div>
          
          <button
            onClick={() => {
              if (window.confirm('⚠️ This will permanently delete ALL your data. Are you sure?')) {
                clearLocalStorage();
                setChallenges([]);
                setActiveChallenge(null);
                setShowSettings(false);
                alert('🗑️ All data cleared successfully!');
              }
            }}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );

  const NewChallengeForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      days: '30',
      description: '',
      startDate: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = () => {
      if (formData.title && formData.days) {
        createChallenge(formData.title, formData.days, formData.description, formData.startDate);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Start New Challenge</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Daily Algorithm Practice"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (Days)
              </label>
              <select
                value={formData.days}
                onChange={(e) => setFormData({...formData, days: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">7 Days</option>
                <option value="15">15 Days</option>
                <option value="30">30 Days</option>
                <option value="45">45 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
                <option value="100">100 Days</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="What are you planning to learn or achieve?"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowNewChallenge(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Start Challenge
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DayEntry = ({ challenge, day }) => {
    const [entry, setEntry] = useState(challenge.entries[day] || '');
    const [isEditing, setIsEditing] = useState(!challenge.entries[day]);
    
    const dateString = getDateForDay(challenge.startDate, day);
    const fullDate = formatFullDate(dateString);

    const saveEntry = () => {
      if (entry.trim()) {
        addEntry(challenge.id, day, entry.trim());
        setIsEditing(false);
        setSelectedDay(null);
      }
    };

    const handleDelete = () => {
      deleteEntry(challenge.id, day);
      setSelectedDay(null);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Day {day}</h3>
              <p className="text-sm text-gray-500">{fullDate}</p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="What did you learn today? Any insights, challenges, or breakthroughs?"
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEntry(challenge.entries[day] || '');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEntry}
                  disabled={!entry.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{challenge.entries[day]}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProgressGrid = ({ challenge }) => {
    const days = Array.from({ length: challenge.totalDays }, (_, i) => i + 1);
    
    return (
      <div className="grid grid-cols-7 gap-2 mt-6">
        {days.map(day => {
          const dateString = getDateForDay(challenge.startDate, day);
          const hasEntry = challenge.entries[day];
          const isPast = isDateInPast(dateString);
          const isToday = isDateToday(dateString);
          const isFuture = isDateInFuture(dateString);
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`
                aspect-square rounded-lg border-2 text-xs font-medium transition-all hover:scale-105 p-1 flex flex-col items-center justify-center
                ${hasEntry 
                  ? 'bg-green-500 text-white border-green-500 shadow-lg' 
                  : isToday
                  ? 'bg-blue-100 text-blue-800 border-blue-400 ring-2 ring-blue-300'
                  : isPast
                  ? 'bg-red-50 text-red-600 border-red-200 hover:border-red-400'
                  : 'bg-gray-100 text-gray-400 border-gray-200 hover:border-blue-300'
                }
              `}
              title={`${formatFullDate(dateString)} - ${hasEntry ? 'Completed' : isToday ? 'Today' : isPast ? 'Missed' : 'Upcoming'}`}
            >
              <span className="text-xs">{formatDate(dateString)}</span>
              <span className="text-xs opacity-75">D{day}</span>
            </button>
          );
        })}
      </div>
    );
  };

  if (challenges.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-8">
              <BookOpen className="w-20 h-20 text-blue-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Developer Learning Tracker
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Track your daily progress, stay consistent, and build better learning habits.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to start your learning journey?</h2>
              <p className="text-gray-600 mb-6">
                Create your first challenge and begin tracking your daily progress with real calendar dates.
              </p>
              <button
                onClick={() => setShowNewChallenge(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Start Your First Challenge
              </button>
            </div>
          </div>
        </div>
        {showNewChallenge && <NewChallengeForm />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              Learning Tracker
            </h1>
            <p className="text-gray-600 mt-1">Build consistent learning habits with real dates</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Settings
            </button>
            <button
              onClick={() => setShowNewChallenge(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Challenge
            </button>
          </div>
        </div>

        {/* Challenge Selection */}
        {challenges.length > 1 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Your Challenges</h2>
            <div className="flex flex-wrap gap-3">
              {challenges.map(challenge => (
                <button
                  key={challenge.id}
                  onClick={() => setActiveChallenge(challenge)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeChallenge?.id === challenge.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                  } ${challenge.completed ? 'border-green-500 bg-green-50' : ''}`}
                >
                  <div>
                    <div className="font-medium">{challenge.title} {challenge.completed && '✅'}</div>
                    <div className="text-xs opacity-75">Started {formatDate(challenge.startDate)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Challenge */}
        {activeChallenge && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-2xl font-bold">{activeChallenge.title}</h2>
                  <p className="text-blue-100 text-sm">
                    Started: {formatFullDate(activeChallenge.startDate)}
                  </p>
                </div>
                {!activeChallenge.completed && getProgressPercentage(activeChallenge) === 100 && (
                  <button
                    onClick={() => markChallengeComplete(activeChallenge.id)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-sm"
                  >
                    Mark Complete 🎉
                  </button>
                )}
              </div>
              {activeChallenge.description && (
                <p className="text-blue-100 mb-4">{activeChallenge.description}</p>
              )}
              
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-5 h-5" />
                    <span className="text-sm font-medium">Progress</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {getCompletedDays(activeChallenge)}/{activeChallenge.totalDays}
                  </div>
                  <div className="text-sm text-blue-100">
                    {getProgressPercentage(activeChallenge)}% Complete
                  </div>
                </div>
                
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Current Streak</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {getCurrentStreak(activeChallenge)}
                  </div>
                  <div className="text-sm text-blue-100">Days in a row</div>
                </div>
                
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Days Left</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {activeChallenge.totalDays - getCompletedDays(activeChallenge)}
                  </div>
                  <div className="text-sm text-blue-100">To completion</div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-500">{getProgressPercentage(activeChallenge)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage(activeChallenge)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Progress Grid with Real Dates */}
              <div className="mb-4">
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded"></div>
                    <span>Missed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
                    <span>Upcoming</span>
                  </div>
                </div>
              </div>
              
              {/* Progress Grid */}
              <ProgressGrid challenge={activeChallenge} />
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Click on any date to add or edit your learning entry
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewChallenge && <NewChallengeForm />}
      {showSettings && <SettingsModal />}
      {selectedDay && activeChallenge && (
        <DayEntry challenge={activeChallenge} day={selectedDay} />
      )}
    </div>
  );
};

export default LearningTracker;