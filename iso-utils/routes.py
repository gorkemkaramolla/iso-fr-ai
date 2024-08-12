import os
from flask import Flask, Blueprint, request, jsonify, abort, send_from_directory
from pymongo import MongoClient
from services.system_monitoring import SystemMonitoring
from services.personel_service import PersonelService
from services.solr_search import SolrSearcher  # Ensure this is correctly imported
from logger import configure_logging
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required
from bson import ObjectId
from werkzeug.utils import secure_filename
from config import XMLConfig

# Initialize the configuration for the 'utils_service'
xml_config = XMLConfig(service_name='utils_service')
xml_mongo_config = XMLConfig(service_name='mongo')

app = Flask(__name__)

# Configure CORS using the values from xml_config
CORS(app, supports_credentials=xml_config.SUPPORTS_CREDENTIALS, origins=xml_config.CORS_ORIGINS)

# Configure JWT using the values from xml_config
app.config["JWT_SECRET_KEY"] = xml_config.JWT_SECRET_KEY
app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
app.config["JWT_ACCESS_COOKIE_PATH"] = xml_config.JWT_ACCESS_COOKIE_PATH
app.config["JWT_REFRESH_COOKIE_PATH"] = xml_config.JWT_REFRESH_COOKIE_PATH
app.config["JWT_COOKIE_SECURE"] = xml_config.JWT_COOKIE_SECURE  # Set to False in production with HTTPS
app.config["JWT_COOKIE_CSRF_PROTECT"] = xml_config.JWT_COOKIE_CSRF_PROTECT  # Enable CSRF protection in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = xml_config.get_jwt_expire_timedelta()
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = xml_config.get_jwt_refresh_expire_timedelta()


# Setup MongoDB
client = MongoClient(xml_mongo_config.MONGO_DB_URI)
db = client[xml_mongo_config.MONGO_DB_NAME]

# Setup Solr Searcher
solr_url = xml_config.SOLR_URL
searcher = SolrSearcher(db, solr_url)  # Ensure SolrSearcher is correctly instantiated

# Create an instance of your class
logger = configure_logging()
monitoring_service = SystemMonitoring()
personel_service = PersonelService(db)

# Setup Blueprint
solr_search_bp = Blueprint("solr_search_bp", __name__)
system_check = Blueprint("system_check", __name__)
personel_bp = Blueprint("personel_bp", __name__)

############################## PERSONEL ##############################################
@personel_bp.route("/personel", methods=["POST"])
def add_personel():
    data = request.form.to_dict()
    required_fields = ["name", "lastname", "email"]
    
    for field in required_fields:
        if not data.get(field):
            error_message = f"{field.capitalize()} is required"
            logger.error(error_message)
            return jsonify({"status": "error", "message": error_message}), 400

    file = request.files.get('uploadedFile')  # Retrieve the file with the name 'uploadedFile'
    result, status_code = personel_service.add_personel(data, file)
    return jsonify(result), status_code

@personel_bp.route("/personel/<id>", methods=["DELETE"])
def delete_personel(id):
    result, status_code = personel_service.delete_personel(id)
    return jsonify(result), status_code

@personel_bp.route("/personel", methods=["GET"])
def get_all_personel():
    try:
        persons = list(db["Personel"].find())
        for person in persons:
            person["_id"] = str(person["_id"])
        return jsonify(persons), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@personel_bp.route("/personel/<id>", methods=["GET"])
def get_personel_by_id(id):
    try:
        person = db["Personel"].find_one({"_id": ObjectId(id)})
        if person:
            person["_id"] = str(person["_id"])
            return jsonify(person), 200
        else:
            return jsonify({"status": "error", "message": "Person not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@personel_bp.route('/personel/<personel_id>', methods=['PUT'])
@jwt_required()
def update_personel_route(personel_id):
    try:
        if 'image' in request.files:
            image = request.files['image']
        else:
            image = None
        
        data = request.form.to_dict()  # Use request.form to handle multipart/form-data
        
        result, status = personel_service.update_personel(personel_id, data, file=image)
        return jsonify(result), status
    except Exception as e:
        app.logger.error(f"Error in update_personel_route: {str(e)}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500

@personel_bp.route('/personel/image/', methods=['GET'])
def get_user_images():
    user_id = request.args.get('id')
    if user_id:
        if not user_id:
            return abort(400, description="ID parameter is required")
        image_path = personel_service.get_personel_image_path(user_id)
        if image_path:
            if os.path.exists(image_path):
                return send_from_directory(personel_service.IMAGE_DIRECTORY, os.path.basename(image_path))
            else:
                return abort(404, description="Image file not found on filesystem")
        return abort(404, description="Image not found")
    else:
        image_paths = personel_service.get_all_personel_image_paths()
        return jsonify(image_paths)

app.register_blueprint(personel_bp)

############################## SOLR #########################################
@solr_search_bp.route("/add_to_solr", methods=["POST"])
def add_to_solr():
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400
    result = searcher.add_record_to_solr(data)
    return jsonify(result)

@solr_search_bp.route("/search", methods=["GET"])
def search():
    query = request.args.get("query")
    results, status_code = searcher.search(query)
    if isinstance(results, dict) and 'error' in results:
        return jsonify(results), results.get('status', 400)
    return jsonify(results), status_code

# Add search_logs route
@solr_search_bp.route("/search_logs", methods=["GET"])
def search_logs_route():
    query = request.args.get("query")
    results, status_code = searcher.search_logs(query)
    return jsonify(results), status_code

app.register_blueprint(solr_search_bp)

######################### System Check ###################################

@system_check.route("/system_check/", methods=["GET"])
def system_check_route():
    system_info = monitoring_service.get_system_info()
    return jsonify(system_info)

app.register_blueprint(system_check)
