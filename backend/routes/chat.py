from flask import Blueprint, request, jsonify
from database import get_db
from routes.auth import require_auth
from services.ai_service import AIService
import json

chat_bp = Blueprint("chat", __name__)
ai = AIService()

@chat_bp.route("/message", methods=["POST"])
@require_auth
def send_message():
    user = request.current_user
    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"error": "Message is required"}), 400

    message = data["message"].strip()
    context = data.get("context", "")

    db = get_db()
    # Save user message
    db.execute(
        "INSERT INTO chat_messages (user_id, role, message, context) VALUES (?, ?, ?, ?)",
        (user["id"], "user", message, context)
    )

    # Get recent history (last 6 messages)
    history = db.execute(
        "SELECT role, message FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 6",
        (user["id"],)
    ).fetchall()
    history = [dict(h) for h in reversed(history)]

    # Generate AI response
    ai_reply = ai.chat_response(message, history)

    # Save AI reply
    db.execute(
        "INSERT INTO chat_messages (user_id, role, message) VALUES (?, ?, ?)",
        (user["id"], "assistant", ai_reply)
    )
    db.commit()
    db.close()

    return jsonify({
        "reply": ai_reply,
        "role": "assistant",
        "timestamp": __import__("datetime").datetime.now().isoformat()
    })

@chat_bp.route("/history", methods=["GET"])
@require_auth
def get_history():
    user = request.current_user
    limit = int(request.args.get("limit", 50))
    db = get_db()
    rows = db.execute(
        "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT ?",
        (user["id"], limit)
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@chat_bp.route("/clear", methods=["DELETE"])
@require_auth
def clear_history():
    user = request.current_user
    db = get_db()
    db.execute("DELETE FROM chat_messages WHERE user_id = ?", (user["id"],))
    db.commit()
    db.close()
    return jsonify({"message": "Chat history cleared"})
