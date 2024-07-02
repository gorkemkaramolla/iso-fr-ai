from flask import Flask, Blueprint, request, jsonify
from pymongo import MongoClient
from services.system_monitoring import SystemMonitoring
from services.solr_search import SolrSearcher  # Ensure this is correctly imported
from logger import configure_logging
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required
import os
app = Flask(__name__)
CORS(app, origins="*")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")

# Setup MongoDB
client = MongoClient(os.environ.get("MONGO_DB_URI"))
db = client[os.environ.get("MONGO_DB_NAME")]

# Setup Solr Searcher
solr_url = os.environ.get("SOLR_URL", "http://localhost:8983/solr/mycollection")
searcher = SolrSearcher(client, db, solr_url)

# Create an instance of your class
logger = configure_logging()
system_monitoring_instance = SystemMonitoring()

# Setup Blueprint
solr_search_bp = Blueprint("search_bp", __name__)
system_check = Blueprint("system_check", __name__)

@solr_search_bp.route("/search", methods=["GET"])
def search():
    query = request.args.get("query")
    results = searcher.search(query)
    if isinstance(results, dict) and 'error' in results:
        return jsonify(results), results.get('status', 400)
    return jsonify(results), 200

app.register_blueprint(solr_search_bp, url_prefix="/api")

@app.route("/system_check/", methods=["GET"])
@jwt_required()
def system_check_route():
    system_info = system_monitoring_instance.send_system_info()
    return jsonify(system_info)
app.register_blueprint(system_check)

if __name__ == "__main__":
    app.run(debug=True, port=5004)
