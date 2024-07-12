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
solr_url = os.environ.get("SOLR_URL", "http://localhost:8983/solr/isoai")
searcher = SolrSearcher(client, db, solr_url)

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
    if not user_id:
        return abort(400, description="ID parameter is required")
    
    image_path = personel_service.get_personel_image_path(user_id)
    if image_path:
        if os.path.exists(image_path):
            return send_from_directory(personel_service.IMAGE_DIRECTORY, os.path.basename(image_path))
        else:
            return abort(404, description="Image file not found on filesystem")
    
    return abort(404, description="Image not found")
app.register_blueprint(personel_bp)























@solr_search_bp.route("/add_to_solr", methods=["POST"])
def add_to_solr():
    UPLOAD_FOLDER = '/app/personel_images' 
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    data = request.form.to_dict()
    files = request.files.getlist('files')

    saved_files = []
    for file in files:
        if file and file.filename.endswith(('.png', '.jpg', '.jpeg')):
            try:
                # Generate a unique filename
                filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[-1]

                # Save the file to the 'personel_images' directory
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                saved_files.append(file_path)

                # Add the file path to the data (or convert to base64 if needed)
                data['file_path'] = file_path

            except Exception as e:
                return jsonify({"status": "error", "message": str(e)}), 500
        else:
            return jsonify({"status": "error", "message": "No valid image file provided"}), 400

    # Additional code to add the data to Solr goes here...

    return jsonify({"status": "success", "message": "Files uploaded successfully", "files": saved_files}), 200
























@solr_search_bp.route("/search", methods=["GET"])
def search():
    query = request.args.get("query")
    results = searcher.search(query)
    if isinstance(results, dict) and 'error' in results:
        return jsonify(results), results.get('status', 400)
    return jsonify(results), 200

app.register_blueprint(solr_search_bp)
@app.route("/system_check/", methods=["GET"])
@jwt_required()
def system_check_route():
    system_info = monitoring_service.send_system_info()
    return jsonify(system_info)
app.register_blueprint(system_check)


if __name__ == "__main__":
    app.run(debug=True, port=5004)
