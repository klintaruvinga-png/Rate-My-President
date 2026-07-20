CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL,
  last_seen TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS swipe_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  president_id TEXT,
  date TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK(card_type IN ('home', 'global')),
  action TEXT NOT NULL CHECK(action IN ('like', 'nolike', 'skip')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date, card_type),
  FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY(president_id) REFERENCES presidents(id) ON DELETE CASCADE
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS presidents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  president_id TEXT NOT NULL,
  headline TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(president_id) REFERENCES presidents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_swipe_logs_user_date ON swipe_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_swipe_logs_date ON swipe_logs(date);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
CREATE INDEX IF NOT EXISTS idx_presidents_country ON presidents(country);
CREATE INDEX IF NOT EXISTS idx_presidents_region ON presidents(region);
CREATE INDEX IF NOT EXISTS idx_news_links_president ON news_links(president_id);
