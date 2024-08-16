import xml.etree.ElementTree as ET
import os
from datetime import timedelta

# Define the path to the XML configuration file
CONFIG_XML_PATH = os.path.join(os.path.dirname(__file__), 'config.xml')

class XMLConfig:
    def __init__(self, config_path=CONFIG_XML_PATH, service_name=None):
        # Parse the XML configuration file
        tree = ET.parse(config_path)
        root = tree.getroot()

        # Extract general auth and CORS configuration
        auth_config = root.find('auth_config')
        self.JWT_SECRET_KEY = auth_config.find('jwt').get('secret_key')
        self.JWT_EXPIRE_SECONDS = int(auth_config.find('jwt').get('expire_seconds'))
        self.JWT_TOKEN_LOCATION = eval(auth_config.find('jwt/token_location').text)
        self.JWT_ACCESS_COOKIE_PATH = auth_config.find('jwt/cookie_paths/access').get('path')
        self.JWT_REFRESH_COOKIE_PATH = auth_config.find('jwt/cookie_paths/refresh').get('path')
        self.JWT_COOKIE_SECURE = auth_config.find('jwt/cookie_security').get('secure').lower() == 'true'
        self.JWT_COOKIE_CSRF_PROTECT = auth_config.find('jwt/cookie_security').get('csrf_protect').lower() == 'true'
        self.CORS_ORIGINS = auth_config.find('cors').get('origins')
        self.SUPPORTS_CREDENTIALS = auth_config.find('cors').get('supports_credentials').lower() == 'true'

        # Initialize service-specific attributes with default values
        self.FLASK_PORT = None
        self.FLASK_HOST = None
        self.FLASK_DEBUG = False
        self.DEVICE = 'cpu'
        self.LOGGING_COLLECTION = None
        self.CAMERA_COLLECTION = None
        self.TEMP_DIRECTORY = None
        self.SOLR_URL = None
        self.MONGO_DB_URI = None
        self.MONGO_DB_NAME = None
        self.VIDEO_FOLDER = None
        self.BASE_RECOG_DIR = None
        self.FACE_IMAGES_PATH = None
        self.STREAM_QUALITY_MAPPING = {}

        # Extract service-specific configuration based on the provided service name
        if service_name:
            service_config = root.find(f"services/{service_name}")
            if service_config is not None:
                # Extract common attributes, checking if they exist
                self.FLASK_PORT = int(service_config.get('port')) if service_config.get('port') else None
                self.FLASK_HOST = service_config.get('host')
                self.FLASK_DEBUG = service_config.get('debug', 'false').lower() == 'true'
                self.DEVICE = service_config.get('device', 'cpu')
                
                # Extract optional elements
                self.LOGGING_COLLECTION = self._safe_find_text(service_config, 'logging_collection')
                self.TEMP_DIRECTORY = self._safe_find_text(service_config, 'temp_directory')
                self.SOLR_URL = self._safe_find_text(service_config, 'solr_url')

                # Specific to face_recognition_service
                if service_name == 'face_recognition_service':
                    self.VIDEO_FOLDER = self._safe_find_text(service_config, 'video_folder')
                    self.BASE_RECOG_DIR = self._safe_find_text(service_config, 'base_recog_dir')
                    self.FACE_IMAGES_PATH = self._safe_find_text(service_config, 'face_images_path')
                    self.LOGGING_COLLECTION = self._safe_find_text(service_config, 'logging_collection')
                    self.CAMERA_COLLECTION = self._safe_find_text(service_config, 'camera_collection')
                    self._parse_stream_quality_mapping(service_config)

            else:
                raise ValueError(f"Service '{service_name}' not found in configuration.")
        
        # Extract values from the <mongo> section if it is requested
        if service_name == 'mongo':
            mongo_config = root.find('services/mongo')
            if mongo_config is not None:
                self.MONGO_DB_URI = mongo_config.get('uri')
                self.MONGO_DB_NAME = mongo_config.get('db_name')

    def _safe_find_text(self, element, tag):
        """Helper method to safely extract text from an XML element."""
        found_element = element.find(tag)
        return found_element.text if found_element is not None else None

    def _parse_stream_quality_mapping(self, service_config):
        """Helper method to parse the stream quality mapping."""
        quality_mapping = service_config.find('stream_quality_mapping')
        if quality_mapping is not None:
            for quality in quality_mapping:
                resolution = quality.get('resolution')
                compression = int(quality.get('compression'))
                self.STREAM_QUALITY_MAPPING[quality.tag] = {
                    'resolution': resolution,
                    'compression': compression
                }

    def get_jwt_expire_timedelta(self):
        return timedelta(seconds=self.JWT_EXPIRE_SECONDS)

    def get_jwt_refresh_expire_timedelta(self):
        return timedelta(hours=2)  # Customize as needed

# Example usage:
# xml_config = XMLConfig(service_name='auth_service')
# xml_config = XMLConfig(service_name='mongo')
# xml_config = XMLConfig(service_name='face_recognition_service')
