from flask import Flask, request, jsonify
from flask_cors import CORS
from bson import ObjectId
from werkzeug.utils import secure_filename
import os
from main import AudioTranscriber  # Assuming your AudioTranscriber class is in this file

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

# Configure MongoDB connection
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "audio_transcriptions"

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/transcriptions', methods=['GET'])
def get_all_transcriptions():
    transcriber = AudioTranscriber("dummy.wav", MONGO_URI)
    documents = transcriber.get_all_documents()
    return jsonify([{**doc, '_id': str(doc['_id'])} for doc in documents])

@app.route('/transcriptions/<transcription_id>', methods=['GET'])
def get_transcription(transcription_id):
    transcriber = AudioTranscriber("dummy.wav", MONGO_URI)
    document = transcriber.get_document_by_id(transcription_id)
    if document:
        document['_id'] = str(document['_id'])
        return jsonify(document)
    return jsonify({"error": "Transcription not found"}), 404

@app.route('/transcriptions/<transcription_id>/rename_speaker', methods=['PUT'])
def rename_speaker(transcription_id):
    data = request.json
    segment_index = data.get('segment_index')
    new_speaker_label = data.get('new_speaker_label')
    
    if segment_index is None or new_speaker_label is None:
        return jsonify({"error": "Missing segment_index or new_speaker_label"}), 400

    transcriber = AudioTranscriber("dummy.wav", MONGO_URI)
    result = transcriber.update_speaker_label(transcription_id, segment_index, new_speaker_label)
    
    if result > 0:
        return jsonify({"message": "Speaker label updated successfully"})
    return jsonify({"error": "Failed to update speaker label"}), 404

@app.route('/process_audio', methods=['POST'])
def process_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        transcriber = AudioTranscriber(filepath, MONGO_URI)
        merged_output, info = transcriber.process_audio()
        document_id = transcriber.insert_transcription(merged_output, info)

        return jsonify({
            "message": "Audio processed successfully",
            "document_id": str(document_id),
            "language": info.language,
            "language_probability": info.language_probability
        })
    return jsonify({"error": "File type not allowed"}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')