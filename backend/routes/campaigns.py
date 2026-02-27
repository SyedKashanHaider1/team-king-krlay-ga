from flask import Blueprint, request, jsonify
from database import get_db
from routes.auth import require_auth
from services.ai_service import AIService
import json

campaigns_bp = Blueprint("campaigns", __name__)
ai = AIService()

@campaigns_bp.route("/", methods=["GET"])
@require_auth
def list_campaigns():
    user = request.current_user
    db = get_db()
    rows = db.execute(
        "SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC",
        (user["id"],)
    ).fetchall()
    db.close()
    campaigns = []
    for r in rows:
        c = dict(r)
        c["channels"] = json.loads(c.get("channels") or "[]")
        campaigns.append(c)
    return jsonify(campaigns)

@campaigns_bp.route("/", methods=["POST"])
@require_auth
def create_campaign():
    user = request.current_user
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Campaign name is required"}), 400

    channels = json.dumps(data.get("channels", []))
    db = get_db()
    cursor = db.execute(
        """INSERT INTO campaigns (user_id, name, description, goal, budget, target_audience, channels, status, start_date, end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (user["id"], data["name"], data.get("description", ""), data.get("goal", ""),
         data.get("budget", 0), data.get("target_audience", ""), channels,
         data.get("status", "draft"), data.get("start_date"), data.get("end_date"))
    )
    db.commit()
    new_id = cursor.lastrowid
    row = db.execute("SELECT * FROM campaigns WHERE id = ?", (new_id,)).fetchone()
    db.close()
    campaign = dict(row)
    campaign["channels"] = json.loads(campaign.get("channels") or "[]")
    return jsonify(campaign), 201

@campaigns_bp.route("/<int:campaign_id>", methods=["GET"])
@require_auth
def get_campaign(campaign_id):
    user = request.current_user
    db = get_db()
    row = db.execute("SELECT * FROM campaigns WHERE id = ? AND user_id = ?", (campaign_id, user["id"])).fetchone()
    db.close()
    if not row:
        return jsonify({"error": "Campaign not found"}), 404
    c = dict(row)
    c["channels"] = json.loads(c.get("channels") or "[]")
    if c.get("strategy"):
        try:
            c["strategy"] = json.loads(c["strategy"])
        except:
            pass
    return jsonify(c)

@campaigns_bp.route("/<int:campaign_id>", methods=["PUT"])
@require_auth
def update_campaign(campaign_id):
    user = request.current_user
    data = request.get_json()
    db = get_db()
    row = db.execute("SELECT * FROM campaigns WHERE id = ? AND user_id = ?", (campaign_id, user["id"])).fetchone()
    if not row:
        db.close()
        return jsonify({"error": "Campaign not found"}), 404

    channels = json.dumps(data.get("channels", json.loads(row["channels"] or "[]")))
    db.execute(
        """UPDATE campaigns SET name=?, description=?, goal=?, budget=?, target_audience=?,
           channels=?, status=?, start_date=?, end_date=?, updated_at=CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?""",
        (data.get("name", row["name"]), data.get("description", row["description"]),
         data.get("goal", row["goal"]), data.get("budget", row["budget"]),
         data.get("target_audience", row["target_audience"]), channels,
         data.get("status", row["status"]), data.get("start_date", row["start_date"]),
         data.get("end_date", row["end_date"]), campaign_id, user["id"])
    )
    db.commit()
    updated = db.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,)).fetchone()
    db.close()
    c = dict(updated)
    c["channels"] = json.loads(c.get("channels") or "[]")
    return jsonify(c)

@campaigns_bp.route("/<int:campaign_id>", methods=["DELETE"])
@require_auth
def delete_campaign(campaign_id):
    user = request.current_user
    db = get_db()
    row = db.execute("SELECT id FROM campaigns WHERE id = ? AND user_id = ?", (campaign_id, user["id"])).fetchone()
    if not row:
        db.close()
        return jsonify({"error": "Campaign not found"}), 404
    db.execute("DELETE FROM campaigns WHERE id = ? AND user_id = ?", (campaign_id, user["id"]))
    db.commit()
    db.close()
    return jsonify({"message": "Campaign deleted"})

@campaigns_bp.route("/<int:campaign_id>/generate-strategy", methods=["POST"])
@require_auth
def generate_strategy(campaign_id):
    user = request.current_user
    db = get_db()
    row = db.execute("SELECT * FROM campaigns WHERE id = ? AND user_id = ?", (campaign_id, user["id"])).fetchone()
    if not row:
        db.close()
        return jsonify({"error": "Campaign not found"}), 404
    c = dict(row)
    channels = json.loads(c.get("channels") or "[]")
    strategy = ai.generate_campaign_strategy(
        c["name"], c.get("goal", "Increase brand awareness"),
        c.get("target_audience", "General audience"),
        float(c.get("budget") or 0), channels,
        c.get("start_date", ""), c.get("end_date", "")
    )
    strategy_json = json.dumps(strategy)
    db.execute("UPDATE campaigns SET strategy = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
               (strategy_json, campaign_id))
    db.commit()
    db.close()
    return jsonify({"strategy": strategy, "campaign_id": campaign_id})

@campaigns_bp.route("/stats", methods=["GET"])
@require_auth
def campaign_stats():
    user = request.current_user
    db = get_db()
    total = db.execute("SELECT COUNT(*) as cnt FROM campaigns WHERE user_id = ?", (user["id"],)).fetchone()["cnt"]
    active = db.execute("SELECT COUNT(*) as cnt FROM campaigns WHERE user_id = ? AND status = 'active'", (user["id"],)).fetchone()["cnt"]
    draft = db.execute("SELECT COUNT(*) as cnt FROM campaigns WHERE user_id = ? AND status = 'draft'", (user["id"],)).fetchone()["cnt"]
    scheduled = db.execute("SELECT COUNT(*) as cnt FROM campaigns WHERE user_id = ? AND status = 'scheduled'", (user["id"],)).fetchone()["cnt"]
    db.close()
    return jsonify({"total": total, "active": active, "draft": draft, "scheduled": scheduled})
