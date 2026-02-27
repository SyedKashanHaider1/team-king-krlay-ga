from flask import Blueprint, request, jsonify
import jwt
import datetime
import hashlib
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db
from config import Config

auth_bp = Blueprint("auth", __name__)

def hash_password(password, salt=None):
    if not salt:
        salt = secrets.token_hex(16)
    hashed = generate_password_hash(password + salt)
    return hashed, salt

def verify_password(password, hashed, salt):
    return check_password_hash(hashed, password + salt)

def generate_access_token(user_id, email):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=Config.JWT_ACCESS_EXPIRY_MINUTES),
        "iat": datetime.datetime.utcnow(),
        "type": "access"
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

def generate_refresh_token(user_id):
    token = secrets.token_hex(32)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=Config.JWT_REFRESH_EXPIRY_DAYS)
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    db = get_db()
    cursor = db.execute(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
        (user_id, token_hash, expires_at)
    )
    db.commit()
    db.close()

    return token

def verify_refresh_token(token):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    db = get_db()
    row = db.execute(
        "SELECT user_id, expires_at FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL",
        (token_hash,)
    ).fetchone()
    db.close()
    if not row or datetime.datetime.utcnow() > datetime.datetime.fromisoformat(row["expires_at"]):
        return None
    return row["user_id"]

def revoke_refresh_token(token):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    db = get_db()
    db.execute("UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ?", (token_hash,))
    db.commit()
    db.close()

def verify_access_token(token):
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = verify_access_token(token)
    if not payload:
        return None
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (payload["user_id"],)).fetchone()
    db.close()
    if user:
        return dict(user)
    return None

def require_auth(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized", "message": "Valid authentication token required"}), 401
        request.current_user = user
        return f(*args, **kwargs)
    return decorated

def _set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=request.is_secure,
        samesite="Lax",
        max_age=Config.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60
    )
    return response

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password") or not data.get("name"):
        return jsonify({"error": "Email, password, and name are required"}), 400

    email = data["email"].strip().lower()
    password = data["password"]
    name = data["name"].strip()

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        db.close()
        return jsonify({"error": "User with this email already exists"}), 409

    hashed, salt = hash_password(password)
    cursor = db.execute(
        "INSERT INTO users (email, name, password_hash, salt) VALUES (?, ?, ?, ?)",
        (email, name, hashed, salt)
    )
    user_id = cursor.lastrowid
    db.commit()
    db.close()

    access_token = generate_access_token(user_id, email)
    refresh_token = generate_refresh_token(user_id)

    response = jsonify({
        "access_token": access_token,
        "user": {"id": user_id, "name": name, "email": email}
    })
    _set_refresh_cookie(response, refresh_token)
    return response, 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    email = data["email"].strip().lower()
    password = data["password"]

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    db.close()
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    # Legacy users (e.g. previously created by Google/demo flows) may not have password credentials.
    if not user["password_hash"] or not user["salt"]:
        return jsonify({"error": "Invalid email or password"}), 401

    if not verify_password(password, user["password_hash"], user["salt"]):
        return jsonify({"error": "Invalid email or password"}), 401

    user_id = user["id"]
    db = get_db()
    db.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", (user_id,))
    db.commit()
    db.close()

    access_token = generate_access_token(user_id, email)
    refresh_token = generate_refresh_token(user_id)

    response = jsonify({
        "access_token": access_token,
        "user": {"id": user_id, "name": user["name"], "email": email}
    })
    _set_refresh_cookie(response, refresh_token)
    return response

@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        return jsonify({"error": "Refresh token required"}), 401

    user_id = verify_refresh_token(refresh_token)
    if not user_id:
        return jsonify({"error": "Invalid or expired refresh token"}), 401

    db = get_db()
    user = db.execute("SELECT email FROM users WHERE id = ?", (user_id,)).fetchone()
    db.close()
    if not user:
        return jsonify({"error": "User not found"}), 401

    access_token = generate_access_token(user_id, user["email"])
    new_refresh_token = generate_refresh_token(user_id)
    revoke_refresh_token(refresh_token)

    response = jsonify({"access_token": access_token})
    _set_refresh_cookie(response, new_refresh_token)
    return response

@auth_bp.route("/logout", methods=["POST"])
def logout():
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        revoke_refresh_token(refresh_token)

    response = jsonify({"message": "Logged out successfully"})
    response.set_cookie(
        "refresh_token",
        "",
        expires=0,
        httponly=True,
        secure=request.is_secure,
        samesite="Lax",
    )
    return response

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    user = request.current_user
    return jsonify({
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "avatar": user.get("avatar", ""),
        "created_at": user.get("created_at"),
        "last_login": user.get("last_login")
    })
