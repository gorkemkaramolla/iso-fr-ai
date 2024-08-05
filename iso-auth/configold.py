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
    def __init__(self, config_path=CONFIG_XML_PATH):
        # Parse the XML configuration file
        tree = ET.parse(config_path)
        root = tree.getroot()

        # Extract values from the <auth_config> section
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

        # Extract values from the <services> section
        services_config = root.find('services')
        auth_service_config = services_config.find('auth_service')
        self.FLASK_PORT = int(auth_service_config.get('port'))
        self.FLASK_HOST = auth_service_config.get('host')
        self.FLASK_DEBUG = auth_service_config.get('debug').lower() == 'true'

        # Extract values from the <mongo> section
        mongo_config = services_config.find('mongo')
        self.MONGO_DB_URI = mongo_config.get('uri')
        self.MONGO_DB_NAME = mongo_config.get('db_name')

    def get_jwt_expire_timedelta(self):
        return timedelta(seconds=self.JWT_EXPIRE_SECONDS)

    def get_jwt_refresh_expire_timedelta(self):
        return timedelta(hours=2)  # Customize as needed

# Initialize the XML configuration
xml_config = XMLConfig()
