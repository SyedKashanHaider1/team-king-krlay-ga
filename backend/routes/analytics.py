from flask import Blueprint, request, jsonify
from routes.auth import require_auth
from services.analytics_service import AnalyticsService

analytics_bp = Blueprint("analytics", __name__)
analytics_svc = AnalyticsService()

@analytics_bp.route("/overview", methods=["GET"])
@require_auth
def overview():
    user = request.current_user
    data = analytics_svc.get_overview(user["id"])
    return jsonify(data)

@analytics_bp.route("/engagement", methods=["GET"])
@require_auth
def engagement():
    days = int(request.args.get("days", 30))
    data = analytics_svc.get_engagement_timeline(days)
    return jsonify(data)

@analytics_bp.route("/channels", methods=["GET"])
@require_auth
def channels():
    data = analytics_svc.get_channel_breakdown()
    return jsonify(data)

@analytics_bp.route("/top-content", methods=["GET"])
@require_auth
def top_content():
    limit = int(request.args.get("limit", 5))
    data = analytics_svc.get_top_content(limit)
    return jsonify(data)

@analytics_bp.route("/funnel", methods=["GET"])
@require_auth
def funnel():
    data = analytics_svc.get_funnel_data()
    return jsonify(data)

@analytics_bp.route("/demographics", methods=["GET"])
@require_auth
def demographics():
    data = analytics_svc.get_audience_demographics()
    return jsonify(data)

@analytics_bp.route("/heatmap", methods=["GET"])
@require_auth
def heatmap():
    data = analytics_svc.get_heatmap_data()
    return jsonify(data)

@analytics_bp.route("/optimisation-tips", methods=["POST"])
@require_auth
def optimisation_tips():
    from services.ai_service import AIService
    ai = AIService()
    channel_data = request.get_json() or {}
    if not channel_data:
        channel_data = {
            "instagram": {"engagement_rate": 4.2},
            "facebook": {"engagement_rate": 2.1},
            "email": {"engagement_rate": 6.8},
            "linkedin": {"engagement_rate": 3.5}
        }
    tips = ai.generate_optimisation_tips(channel_data)
    return jsonify(tips)
