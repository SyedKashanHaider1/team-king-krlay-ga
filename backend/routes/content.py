from flask import Blueprint, request, jsonify
from database import get_db
from routes.auth import require_auth
from services.ai_service import AIService
import json

content_bp = Blueprint("content", __name__)
ai = AIService()

@content_bp.route("/generate", methods=["POST"])
@require_auth
def generate_content():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400
    channel = data.get("channel", "instagram")
    content_type = data.get("content_type", "social_post")
    topic = data.get("topic", "our latest offer")
    tone = data.get("tone", "professional")
    brand_name = data.get("brand_name", "Your Brand")
    keywords = data.get("keywords", [])
    result = ai.generate_content(channel, content_type, topic, tone, brand_name, keywords)
    return jsonify(result)

@content_bp.route("/", methods=["GET"])
@require_auth
def list_content():
    user = request.current_user
    channel = request.args.get("channel")
    status = request.args.get("status")
    campaign_id = request.args.get("campaign_id")
    query = "SELECT * FROM content_items WHERE user_id = ?"
    params = [user["id"]]
    if channel:
        query += " AND channel = ?"
        params.append(channel)
    if status:
        query += " AND status = ?"
        params.append(status)
    if campaign_id:
        query += " AND campaign_id = ?"
        params.append(campaign_id)
    query += " ORDER BY created_at DESC"
    db = get_db()
    rows = db.execute(query, params).fetchall()
    db.close()
    items = []
    for r in rows:
        item = dict(r)
        item["hashtags"] = json.loads(item.get("hashtags") or "[]")
        items.append(item)
    return jsonify(items)

@content_bp.route("/", methods=["POST"])
@require_auth
def save_content():
    user = request.current_user
    data = request.get_json()
    if not data or not data.get("body"):
        return jsonify({"error": "Content body is required"}), 400
    hashtags = json.dumps(data.get("hashtags", []))
    db = get_db()
    cursor = db.execute(
        """INSERT INTO content_items (user_id, campaign_id, channel, content_type, title, body, tone, hashtags, status, scheduled_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (user["id"], data.get("campaign_id"), data.get("channel", "instagram"),
         data.get("content_type", "social_post"), data.get("title", ""),
         data["body"], data.get("tone", "professional"), hashtags,
         data.get("status", "draft"), data.get("scheduled_at"))
    )
    db.commit()
    new_id = cursor.lastrowid
    row = db.execute("SELECT * FROM content_items WHERE id = ?", (new_id,)).fetchone()
    db.close()
    item = dict(row)
    item["hashtags"] = json.loads(item.get("hashtags") or "[]")
    return jsonify(item), 201

@content_bp.route("/<int:content_id>", methods=["PUT"])
@require_auth
def update_content(content_id):
    user = request.current_user
    data = request.get_json()
    db = get_db()
    row = db.execute("SELECT * FROM content_items WHERE id = ? AND user_id = ?", (content_id, user["id"])).fetchone()
    if not row:
        db.close()
        return jsonify({"error": "Content not found"}), 404
    hashtags = json.dumps(data.get("hashtags", json.loads(row["hashtags"] or "[]")))
    db.execute(
        """UPDATE content_items SET title=?, body=?, tone=?, hashtags=?, status=?, scheduled_at=?, updated_at=CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?""",
        (data.get("title", row["title"]), data.get("body", row["body"]),
         data.get("tone", row["tone"]), hashtags, data.get("status", row["status"]),
         data.get("scheduled_at", row["scheduled_at"]), content_id, user["id"])
    )
    db.commit()
    updated = db.execute("SELECT * FROM content_items WHERE id = ?", (content_id,)).fetchone()
    db.close()
    item = dict(updated)
    item["hashtags"] = json.loads(item.get("hashtags") or "[]")
    return jsonify(item)

@content_bp.route("/<int:content_id>", methods=["DELETE"])
@require_auth
def delete_content(content_id):
    user = request.current_user
    db = get_db()
    row = db.execute("SELECT id FROM content_items WHERE id = ? AND user_id = ?", (content_id, user["id"])).fetchone()
    if not row:
        db.close()
        return jsonify({"error": "Content not found"}), 404
    db.execute("DELETE FROM content_items WHERE id = ? AND user_id = ?", (content_id, user["id"]))
    db.commit()
    db.close()
    return jsonify({"message": "Content deleted"})

@content_bp.route("/<int:content_id>/publish", methods=["POST"])
@require_auth
def publish_content(content_id):
    import datetime, time
    user = request.current_user
    db = get_db()
    row = db.execute("SELECT * FROM content_items WHERE id = ? AND user_id = ?", (content_id, user["id"])).fetchone()
    if not row:
        db.close()
        return jsonify({"error": "Content not found"}), 404
    published_at = datetime.datetime.now().isoformat()
    db.execute("UPDATE content_items SET status='published', published_at=? WHERE id = ?",
               (published_at, content_id))
    db.commit()
    db.close()
    return jsonify({"message": "Content published successfully", "published_at": published_at, "status": "published"})

@content_bp.route("/variations", methods=["POST"])
@require_auth
def generate_variations():
    data = request.get_json()
    if not data or not data.get("topic"):
        return jsonify({"error": "Topic required"}), 400
    tones = ["professional", "casual", "urgent", "playful", "inspirational"]
    channel = data.get("channel", "instagram")
    topic = data["topic"]
    brand = data.get("brand_name", "Your Brand")
    variations = []
    for tone in tones[:3]:
        result = ai.generate_content(channel, "social_post", topic, tone, brand)
        variations.append({"tone": tone, **result})
    return jsonify({"variations": variations})
