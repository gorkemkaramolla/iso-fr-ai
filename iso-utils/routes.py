from flask import Flask, Blueprint, request, jsonify,abort,send_from_directory
from pymongo import MongoClient
from services.system_monitoring import SystemMonitoring
from services.personel_service import PersonelService
from services.solr_search import SolrSearcher  # Ensure this is correctly imported
from logger import configure_logging
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required
from bson import ObjectId
from logger import configure_logging

import os
app = Flask(__name__)
CORS(app, origins="*")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")

# Setup MongoDB
client = MongoClient(os.environ.get("MONGO_DB_URI"))
db = client[os.environ.get("MONGO_DB_NAME")]

# Setup Solr Searcher
solr_url = os.environ.get("SOLR_URL", "http://solr:8983/solr/isoai")
searcher = SolrSearcher(db, solr_url)

# Create an instance of your class
logger = configure_logging()
monitoring_service = SystemMonitoring()
personel_service = PersonelService(db)
# Setup Blueprint
solr_search_bp = Blueprint("solar_search_bp", __name__)
system_check = Blueprint("system_check", __name__)
personel_bp = Blueprint("personel_bp", __name__)



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
    personel_service = PersonelService(db)  # Assume `db` is your database connection
    result, status_code = personel_service.add_personel(data, file)

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

@personel_bp.route('/personel/image/', methods=['GET'])
def get_user_images():
    user_id = request.args.get('id')
    if  user_id :
        if not user_id:
            return abort(400, description="ID parameter is required")
    
        image_path = personel_service.get_personel_image_path(user_id)
        if image_path:
            if os.path.exists(image_path):
                return send_from_directory(personel_service.IMAGE_DIRECTORY, os.path.basename(image_path))
            else:
                return abort(404, description="Image file not found on filesystem")
        
        return abort(404, description="Image not found")
    else : 
        image_paths = personel_service.get_all_personel_image_paths()
        return image_paths;
app.register_blueprint(personel_bp)

@solr_search_bp.route("/add_to_solr", methods=["POST"])
def add_to_solr(self, data):
    try:
        headers = {'Content-Type': 'application/json'}
        response = requests.post(f'{self.solr_url}/update?commit=true', headers=headers, data=json.dumps(data))
        response.raise_for_status()
        return {"status": "success", "message": "Document added to Solr"}
    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": str(e)}

@solr_search_bp.route("/search", methods=["GET"])
def search():
    query = request.args.get("query")
    results = searcher.search(query)
    if isinstance(results, dict) and 'error' in results:
        return jsonify(results), results.get('status', 400)
    return jsonify(results), 200

app.register_blueprint(solr_search_bp)
@app.route("/system_check/", methods=["GET1"])
@jwt_required()
def system_check_route():
    system_info = monitoring_service.send_system_info()
    return jsonify(system_info)
app.register_blueprint(system_check)