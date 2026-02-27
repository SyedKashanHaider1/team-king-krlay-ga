from flask import Blueprint, request, jsonify
from database import get_db
from routes.auth import require_auth
from services.ai_service import AIService
import json

auto_reply_bp = Blueprint("auto_reply", __name__)
ai = AIService()

@auto_reply_bp.route("/rules", methods=["GET"])
@require_auth
def list_rules():
    user = request.current_user
    db = get_db()
    rows = db.execute("SELECT * FROM auto_reply_rules WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@auto_reply_bp.route("/rules", methods=["POST"])
@require_auth
def create_rule():
    user = request.current_user
    data = request.get_json()
    if not data or not data.get("trigger_keyword") or not data.get("reply_text"):
        return jsonify({"error": "trigger_keyword and reply_text required"}), 400
    db = get_db()
    cursor = db.execute(
        "INSERT INTO auto_reply_rules (user_id, trigger_keyword, reply_text, channel, is_active) VALUES (?,?,?,?,?)",
        (user["id"], data["trigger_keyword"], data["reply_text"], data.get("channel","all"), 1)
    )
    db.commit()
    row = db.execute("SELECT * FROM auto_reply_rules WHERE id = ?", (cursor.lastrowid,)).fetchone()
    db.close()
    return jsonify(dict(row)), 201

@auto_reply_bp.route("/rules/<int:rule_id>", methods=["PUT"])
@require_auth
def update_rule(rule_id):
    user = request.current_user
    data = request.get_json()
    db = get_db()
    row = db.execute("SELECT * FROM auto_reply_rules WHERE id = ? AND user_id = ?", (rule_id, user["id"])).fetchone()
    if not row:
        db.close()
        return jsonify({"error": "Rule not found"}), 404
    db.execute(
        "UPDATE auto_reply_rules SET trigger_keyword=?, reply_text=?, channel=?, is_active=? WHERE id=? AND user_id=?",
        (data.get("trigger_keyword", row["trigger_keyword"]), data.get("reply_text", row["reply_text"]),
         data.get("channel", row["channel"]), data.get("is_active", row["is_active"]), rule_id, user["id"])
    )
    db.commit()
    updated = db.execute("SELECT * FROM auto_reply_rules WHERE id = ?", (rule_id,)).fetchone()
    db.close()
    return jsonify(dict(updated))

@auto_reply_bp.route("/rules/<int:rule_id>", methods=["DELETE"])
@require_auth
def delete_rule(rule_id):
    user = request.current_user
    db = get_db()
    db.execute("DELETE FROM auto_reply_rules WHERE id = ? AND user_id = ?", (rule_id, user["id"]))
    db.commit()
    db.close()
    return jsonify({"message": "Rule deleted"})

@auto_reply_bp.route("/simulate", methods=["POST"])
@require_auth
def simulate_reply():
    user = request.current_user
    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"error": "message required"}), 400
    incoming = data["message"]
    db = get_db()
    faqs = [dict(r) for r in db.execute("SELECT * FROM faqs WHERE user_id = ?", (user["id"],)).fetchall()]
    rules = [dict(r) for r in db.execute(
        "SELECT * FROM auto_reply_rules WHERE user_id = ? AND is_active = 1", (user["id"],)
    ).fetchall()]
    db.close()

    # Check custom rules first
    for rule in rules:
        if rule["trigger_keyword"].lower() in incoming.lower():
            db = get_db()
            db.execute("UPDATE auto_reply_rules SET match_count = match_count + 1 WHERE id = ?", (rule["id"],))
            db.commit()
            db.close()
            return jsonify({
                "reply": rule["reply_text"],
                "source": "custom_rule",
                "rule_id": rule["id"],
                "confidence": 1.0,
                "escalate": False
            })

    result = ai.generate_auto_reply(incoming, faqs)
    return jsonify(result)

@auto_reply_bp.route("/faqs", methods=["GET"])
@require_auth
def list_faqs():
    user = request.current_user
    db = get_db()
    rows = db.execute("SELECT * FROM faqs WHERE user_id = ? ORDER BY usage_count DESC", (user["id"],)).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@auto_reply_bp.route("/faqs", methods=["POST"])
@require_auth
def create_faq():
    user = request.current_user
    data = request.get_json()
    if not data or not data.get("question") or not data.get("answer"):
        return jsonify({"error": "question and answer required"}), 400
    db = get_db()
    cursor = db.execute(
        "INSERT INTO faqs (user_id, question, answer, category) VALUES (?,?,?,?)",
        (user["id"], data["question"], data["answer"], data.get("category","general"))
    )
    db.commit()
    row = db.execute("SELECT * FROM faqs WHERE id = ?", (cursor.lastrowid,)).fetchone()
    db.close()
    return jsonify(dict(row)), 201

@auto_reply_bp.route("/faqs/<int:faq_id>", methods=["DELETE"])
@require_auth
def delete_faq(faq_id):
    user = request.current_user
    db = get_db()
    db.execute("DELETE FROM faqs WHERE id = ? AND user_id = ?", (faq_id, user["id"]))
    db.commit()
    db.close()
    return jsonify({"message": "FAQ deleted"})
