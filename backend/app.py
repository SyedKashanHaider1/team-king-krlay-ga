import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from database import init_db

from routes.auth import auth_bp
from routes.campaigns import campaigns_bp
from routes.content import content_bp
from routes.analytics import analytics_bp
from routes.chat import chat_bp
from routes.calendar import calendar_bp
from routes.auto_reply import auto_reply_bp

def create_app():
    app = Flask(__name__, static_folder="../frontend", static_url_path="")

    # CORS
    CORS(app, resources={r"/api/*": {"origins": [Config.FRONTEND_URL]}}, supports_credentials=True)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(campaigns_bp, url_prefix="/api/campaigns")
    app.register_blueprint(content_bp, url_prefix="/api/content")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(calendar_bp, url_prefix="/api/calendar")
    app.register_blueprint(auto_reply_bp, url_prefix="/api/auto-reply")

    # Health check
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "AI Marketing Command Center", "version": "1.0.0"})

    # Serve frontend for all non-API routes (SPA routing)
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
        frontend_dir = os.path.abspath(frontend_dir)
        if path and os.path.exists(os.path.join(frontend_dir, path)):
            return send_from_directory(frontend_dir, path)
        return send_from_directory(frontend_dir, "index.html")

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    print("\nInitialising AI Marketing Command Center...")
    init_db()
    app = create_app()
    print("All systems ready!")
    print("Open http://localhost:5000 in your browser\n")
    app.run(host="0.0.0.0", port=5000, debug=Config.DEBUG)
