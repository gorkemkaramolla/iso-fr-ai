# import oracledb
from config import DB_USER, DB_PASSWORD, DB_PORT, DB_SERVICE_NAME, DB_HOST,MONGO_DB_NAME,MONGO_DB_URI
from pymongo import MongoClient

# connection = oracledb.connect(
#     user=DB_USER,
#     password=DB_PASSWORD,
#     host=DB_HOST,
#     port=DB_PORT,
#     service_name=DB_SERVICE_NAME
# )
# cursor = connection.cursor()
# LOB = oracledb.LOB;
# ERROR = oracledb.Error;



# MONGO DB

mongo_client = MongoClient(MONGO_DB_URI)
mongo_db = mongo_client[MONGO_DB_NAME]


