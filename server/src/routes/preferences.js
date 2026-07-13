const express = require('express');
const { getDatabase, saveDatabase } = require('../db/client');

const router = express.Router();

router.get('/', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  
  try {
    const db = getDatabase();
    
    const stmt = db.prepare('SELECT * FROM user_preferences WHERE user_id = :userId');
    stmt.bind({ ':userId': userId });
    
    let preferences = null;
    let columns = null;
    
    if (stmt.step()) {
      const row = stmt.get();
      columns = stmt.getColumnNames();
      preferences = {};
      columns.forEach((col, index) => {
        preferences[col] = row[index];
      });
    }
    stmt.free();
    
    if (preferences) {
      res.json(preferences);
    } else {
      // Return default preferences
      res.json({
        user_id: userId,
        home_country: null,
        show_micro_history: 1,
        notifications_enabled: 0,
        notification_frequency: 'daily',
        motion_enabled: 1,
        leaderboard_default_sort: 'rank',
        leaderboard_default_window: 'day',
        data_collection_opt_in: 0,
        theme: 'dark',
        language: 'en',
        updated_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Preferences get error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

router.patch('/', (req, res) => {
  const { userId, preferences } = req.body;
  
  if (!userId || !preferences) {
    return res.status(400).json({ error: 'Missing userId or preferences' });
  }
  
  try {
    const db = getDatabase();
    
    // Check if user exists
    const checkStmt = db.prepare('SELECT user_id FROM user_preferences WHERE user_id = :userId');
    checkStmt.bind({ ':userId': userId });
    let userExists = false;
    if (checkStmt.step()) {
      userExists = true;
    }
    checkStmt.free();
    
    const fields = [];
    const values = {};
    
    Object.keys(preferences).forEach(key => {
      if (key !== 'user_id' && key !== 'updated_at') {
        fields.push(`${key} = :${key}`);
        values[`:${key}`] = preferences[key];
      }
    });
    
    values[':updatedAt'] = new Date().toISOString();
    values[':userId'] = userId;
    
    if (userExists) {
      // Update existing
      const query = `UPDATE user_preferences SET ${fields.join(', ')}, updated_at = :updatedAt WHERE user_id = :userId`;
      const updateStmt = db.prepare(query);
      updateStmt.bind(values);
      updateStmt.step();
      updateStmt.free();
    } else {
      // Insert new
      const allFields = ['user_id', ...Object.keys(preferences).filter(k => k !== 'user_id'), 'updated_at'];
      const placeholders = allFields.map(f => `:${f}`).join(', ');
      const allValues = {
        ':userId': userId,
        ':updatedAt': new Date().toISOString()
      };
      
      Object.keys(preferences).forEach(key => {
        if (key !== 'user_id' && key !== 'updated_at') {
          allValues[`:${key}`] = preferences[key];
        }
      });
      
      const query = `INSERT INTO user_preferences (${allFields.join(', ')}) VALUES (${placeholders})`;
      const insertStmt = db.prepare(query);
      insertStmt.bind(allValues);
      insertStmt.step();
      insertStmt.free();
    }
    
    saveDatabase();
    
    // Return updated preferences
    const stmt = db.prepare('SELECT * FROM user_preferences WHERE user_id = :userId');
    stmt.bind({ ':userId': userId });
    
    let updatedPrefs = null;
    let columns = null;
    
    if (stmt.step()) {
      const row = stmt.get();
      columns = stmt.getColumnNames();
      updatedPrefs = {};
      columns.forEach((col, index) => {
        updatedPrefs[col] = row[index];
      });
    }
    stmt.free();
    
    if (updatedPrefs) {
      res.json(updatedPrefs);
    } else {
      res.status(500).json({ error: 'Failed to retrieve updated preferences' });
    }
  } catch (error) {
    console.error('Preferences patch error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
