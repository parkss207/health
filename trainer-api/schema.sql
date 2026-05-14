CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  goal TEXT,
  memo TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  body_part TEXT NOT NULL,
  description TEXT,
  video_url TEXT
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  body_parts TEXT NOT NULL,
  memo TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  weight REAL,
  reps INTEGER,
  memo TEXT,
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  scheduled_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  duration_min INTEGER DEFAULT 60,
  body_parts TEXT,
  memo TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (member_id) REFERENCES members(id)
);
