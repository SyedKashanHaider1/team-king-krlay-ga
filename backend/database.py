import sqlite3
import os
from config import Config

def get_db():
    if Config.DATABASE_TYPE == "postgresql":
        try:
            import psycopg2
            from psycopg2.extras import DictCursor
            conn = psycopg2.connect(Config.DATABASE_URL, cursor_factory=DictCursor)
            conn.autocommit = True
            return conn
        except ImportError:
            print("Warning: psycopg2 not installed, falling back to SQLite")
            Config.DATABASE_TYPE = "sqlite"
            Config.DATABASE_PATH = os.path.join(os.path.dirname(__file__), "data", "marketing.db")
            conn = sqlite3.connect(Config.DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON")
            return conn
    else:
        conn = sqlite3.connect(Config.DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

def init_db():
    if Config.DATABASE_TYPE == "postgresql":
        init_postgres_db()
    else:
        init_sqlite_db()

def init_sqlite_db():
    os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_id TEXT UNIQUE,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            avatar TEXT,
            password_hash TEXT,  -- Added for email/password auth
            salt TEXT,           -- Added for password hashing
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            revoked_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            goal TEXT,
            budget REAL DEFAULT 0,
            target_audience TEXT,
            channels TEXT DEFAULT '[]',
            status TEXT DEFAULT 'draft',
            start_date TEXT,
            end_date TEXT,
            strategy TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS content_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            campaign_id INTEGER,
            channel TEXT NOT NULL,
            content_type TEXT NOT NULL,
            title TEXT,
            body TEXT NOT NULL,
            tone TEXT DEFAULT 'professional',
            hashtags TEXT DEFAULT '[]',
            status TEXT DEFAULT 'draft',
            scheduled_at TEXT,
            published_at TEXT,
            engagement_score REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            campaign_id INTEGER,
            content_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            event_date TEXT NOT NULL,
            event_time TEXT,
            channel TEXT,
            status TEXT DEFAULT 'planned',
            color TEXT DEFAULT '#667eea',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            campaign_id INTEGER,
            content_id INTEGER,
            metric_type TEXT NOT NULL,
            metric_value REAL NOT NULL,
            channel TEXT,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            context TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS auto_reply_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            trigger_keyword TEXT NOT NULL,
            reply_text TEXT NOT NULL,
            channel TEXT DEFAULT 'all',
            is_active INTEGER DEFAULT 1,
            match_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)

    # Lightweight migrations for existing SQLite DBs
    cursor.execute("PRAGMA table_info(users)")
    existing_user_cols = {row[1] for row in cursor.fetchall()}

    cursor.execute("PRAGMA table_info(users)")
    users_info = cursor.fetchall()
    google_id_info = next((r for r in users_info if r[1] == "google_id"), None)
    google_id_is_not_null = bool(google_id_info and google_id_info[3] == 1)

    if "password_hash" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    if "salt" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN salt TEXT")

    # If an older schema requires google_id NOT NULL, recreate users table to allow email/password users.
    if google_id_is_not_null:
        cursor.executescript(
            """
            ALTER TABLE users RENAME TO users_old;

            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                google_id TEXT UNIQUE,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                avatar TEXT,
                password_hash TEXT,
                salt TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO users (id, google_id, email, name, avatar, created_at, last_login)
            SELECT id, google_id, email, name, avatar, created_at, last_login
            FROM users_old;

            DROP TABLE users_old;
            """
        )

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='refresh_tokens'")
    has_refresh = cursor.fetchone() is not None
    if not has_refresh:
        cursor.execute(
            """
            CREATE TABLE refresh_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                revoked_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
            """
        )

    conn.commit()
    conn.close()
    print("Database initialized successfully")

def init_postgres_db():
    conn = get_db()
    cursor = conn.cursor()

    # Create tables with PostgreSQL syntax
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            google_id TEXT UNIQUE,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            avatar TEXT,
            password_hash TEXT,
            salt TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            revoked_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS campaigns (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            goal TEXT,
            budget REAL DEFAULT 0,
            target_audience TEXT,
            channels TEXT DEFAULT '[]',
            status TEXT DEFAULT 'draft',
            start_date TEXT,
            end_date TEXT,
            strategy TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_items (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT,
            type TEXT DEFAULT 'blog',
            status TEXT DEFAULT 'draft',
            seo_keywords TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS calendar_events (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            time TEXT,
            type TEXT DEFAULT 'campaign',
            campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS auto_reply_rules (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            keyword TEXT NOT NULL,
            response TEXT NOT NULL,
            platforms TEXT DEFAULT '[]',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS faqs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            session_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    print("PostgreSQL database initialized successfully")
