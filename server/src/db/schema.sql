CREATE TABLE IF NOT EXISTS swipe_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK(card_type IN ('home', 'global')),
  action TEXT NOT NULL CHECK(action IN ('like', 'nolike', 'skip')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date, card_type)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  home_country TEXT,
  show_micro_history INTEGER DEFAULT 1,
  notifications_enabled INTEGER DEFAULT 0,
  notification_frequency TEXT DEFAULT 'daily',
  motion_enabled INTEGER DEFAULT 1,
  leaderboard_default_sort TEXT DEFAULT 'rank',
  leaderboard_default_window TEXT DEFAULT 'day',
  data_collection_opt_in INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_swipe_logs_user_date ON swipe_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_swipe_logs_date ON swipe_logs(date);
