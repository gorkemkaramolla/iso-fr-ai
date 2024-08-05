import os
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from .env file
load_dotenv()

# Environment variables
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_PORT = os.environ.get("DB_PORT")
DB_SERVICE_NAME = os.environ.get("DB_SERVICE_NAME")
DB_HOST = os.environ.get("DB_HOST")

MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME")
MONGO_DB_URI = os.environ.get("MONGO_DB_URI")

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

        # Extract service-specific configuration based on the provided service name
        if service_name:
            service_config = root.find(f"services/{service_name}")
            if service_config is not None:
                self.FLASK_PORT = int(service_config.get('port'))
                self.FLASK_HOST = service_config.get('host')
                self.FLASK_DEBUG = service_config.get('debug').lower() == 'true'
                self.DEVICE = service_config.get('device', 'cpu')  # Added for device configuration
                self.LOGGING_COLLECTION = service_config.find('logging_collection').text  # Extract logging collection
                self.TEMP_DIRECTORY = service_config.find('temp_directory').text  # Extract temp directory
            else:
                raise ValueError(f"Service '{service_name}' not found in configuration.")
        
        # Extract values from the <mongo> section
        mongo_config = root.find('services/mongo')
        self.MONGO_DB_URI = mongo_config.get('uri')
        self.MONGO_DB_NAME = mongo_config.get('db_name')

    def get_jwt_expire_timedelta(self):
        return timedelta(seconds=self.JWT_EXPIRE_SECONDS)

    def get_jwt_refresh_expire_timedelta(self):
        return timedelta(hours=2)  # Customize as needed

# Usage Example:
# Initialize the configuration for a specific service, e.g., 'speaker_diarization_service'
xml_config = XMLConfig(service_name='speaker_diarization_service')
