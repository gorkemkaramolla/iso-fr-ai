import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_PORT = os.environ.get("DB_PORT")
DB_SERVICE_NAME = os.environ.get("DB_SERVICE_NAME")
DB_HOST = os.environ.get("DB_HOST")


MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME")
MONGO_DB_URI = os.environ.get("MONGO_DB_URI")