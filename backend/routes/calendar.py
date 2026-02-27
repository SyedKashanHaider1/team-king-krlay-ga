from flask import Blueprint, request, jsonify
from database import get_db
from routes.auth import require_auth
from services.ai_service import AIService
import json

calendar_bp = Blueprint("calendar", __name__)
ai = AIService()

@calendar_bp.route("/", methods=["GET"])
@require_auth
def get_events():
    user = request.current_user
    month = int(request.args.get("month", __import__("datetime").datetime.now().month))
    year = int(request.args.get("year", __import__("datetime").datetime.now().year))
    db = get_db()
    rows = db.execute(
        """SELECT * FROM calendar_events WHERE user_id = ?
           AND strftime('%m', event_date) = ? AND strftime('%Y', event_date) = ?
           ORDER BY event_date, event_time""",
        (user["id"], f"{month:02d}", str(year))
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@calendar_bp.route("/generate", methods=["POST"])
@require_auth
def generate_calendar():
    user = request.current_user
    data = request.get_json() or {}
    month = data.get("month", __import__("datetime").datetime.now().month)
    year = data.get("year", __import__("datetime").datetime.now().year)
    db = get_db()
    campaigns = db.execute(
        "SELECT * FROM campaigns WHERE user_id = ? AND status IN ('active','scheduled')",
        (user["id"],)
    ).fetchall()
    calendar_data = ai.generate_calendar(user["id"], int(month), int(year), campaigns)
    # Save to DB
    db.execute(
        "DELETE FROM calendar_events WHERE user_id = ? AND strftime('%m', event_date) = ? AND strftime('%Y', event_date) = ?",
        (user["id"], f"{int(month):02d}", str(int(year)))
    )
    for evt in calendar_data["events"]:
        db.execute(
            """INSERT INTO calendar_events (user_id, title, description, event_date, event_time, channel, status, color)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (user["id"], evt["title"], evt["description"], evt["event_date"],
             evt["event_time"], evt["channel"], evt["status"], evt["color"])
        )
    db.commit()
    rows = db.execute(
        "SELECT * FROM calendar_events WHERE user_id = ? AND strftime('%m', event_date) = ? ORDER BY event_date",
        (user["id"], f"{int(month):02d}")
    ).fetchall()
    db.close()
    return jsonify({"events": [dict(r) for r in rows], "month": month, "year": year})

@calendar_bp.route("/", methods=["POST"])
@require_auth
def create_event():
    user = request.current_user
    data = request.get_json()
    if not data or not data.get("title") or not data.get("event_date"):
        return jsonify({"error": "title and event_date required"}), 400
    db = get_db()
    cursor = db.execute(
        "INSERT INTO calendar_events (user_id, title, description, event_date, event_time, channel, status, color) VALUES (?,?,?,?,?,?,?,?)",
        (user["id"], data["title"], data.get("description",""), data["event_date"],
         data.get("event_time","12:00"), data.get("channel","instagram"),
         data.get("status","planned"), data.get("color","#667eea"))
    )
    db.commit()
    row = db.execute("SELECT * FROM calendar_events WHERE id = ?", (cursor.lastrowid,)).fetchone()
    db.close()
    return jsonify(dict(row)), 201

@calendar_bp.route("/<int:event_id>", methods=["PUT"])
@require_auth
def update_event(event_id):
    user = request.current_user
    data = request.get_json()
    db = get_db()
    row = db.execute("SELECT * FROM calendar_events WHERE id = ? AND user_id = ?", (event_id, user["id"])).fetchone()
    if not row:
        db.close()
        return jsonify({"error": "Event not found"}), 404
    db.execute(
        "UPDATE calendar_events SET title=?,description=?,event_date=?,event_time=?,channel=?,status=?,color=? WHERE id=?",
        (data.get("title", row["title"]), data.get("description", row["description"]),
         data.get("event_date", row["event_date"]), data.get("event_time", row["event_time"]),
         data.get("channel", row["channel"]), data.get("status", row["status"]),
         data.get("color", row["color"]), event_id)
    )
    db.commit()
    updated = db.execute("SELECT * FROM calendar_events WHERE id = ?", (event_id,)).fetchone()
    db.close()
    return jsonify(dict(updated))

@calendar_bp.route("/<int:event_id>", methods=["DELETE"])
@require_auth
def delete_event(event_id):
    user = request.current_user
    db = get_db()
    db.execute("DELETE FROM calendar_events WHERE id = ? AND user_id = ?", (event_id, user["id"]))
    db.commit()
    db.close()
    return jsonify({"message": "Event deleted"})
