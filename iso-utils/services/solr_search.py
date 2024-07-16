import logging
import json
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from pymongo import MongoClient
import uuid

class SolrSearcher:
    def __init__(self, mongo_client, mongo_db, solr_url="http://localhost:8983/solr/isoai"):
        self.mongo_client = mongo_client
        self.mongo_db = mongo_db
        self.mongo_collection = self.mongo_db["Personel"]
        self.solr_url = solr_url
        logging.info(f"Initializing Solr with URL: {self.solr_url}")

    def check_connection(self):
        try:
            connection = urlopen(f'{self.solr_url}/select?q=*:*&wt=json')
            response = json.load(connection)
            logging.info("Connected to Solr, status: %s", response['responseHeader']['status'])
        except Exception as e:
            logging.error("Error connecting to Solr: %s", e)
            raise

    def search(self, query):
        if not query:
            logging.error("Search query is missing.")
            return {"error": "Query parameter is missing"}, 400

        try:
            fields = ["id", "name", "lastname", "title", "address", "phone", "email", "gsm", "resume", "birth_date", "iso_phone", "iso_phone2", "_id"]
            field_query = " OR ".join([f"{field}:\"{query}\"" for field in fields])
            
            # Using the edismax query parser for better multi-field support
            query_params = urlencode({
                'q': field_query,
                'wt': 'json',
                'defType': 'edismax',
                'qf': ' '.join(fields)
            })

            url = f'{self.solr_url}/select?{query_params}'
            logging.info(f"Connecting to Solr URL: {url}")
            connection = urlopen(url)
            response = json.load(connection)
            logging.info(f"Received Solr response: {response}")

            results = response['response']['docs']
            if not results:
                logging.info("No results found in Solr, attempting MongoDB search")
                mongo_results = self.fetch_from_mongo(query)
                return mongo_results if mongo_results else {"error": "No results found"}, 404

            return results
        except Exception as e:
            logging.exception("Exception during search")
            return {"error": "An error occurred during search", "details": str(e)}, 500

    def fetch_from_mongo(self, query):
        try:
            logging.info(f"Fetching from MongoDB with query: {query}")
            mongo_results = list(self.mongo_collection.find({
                "$text": {"$search": query}
            }))
            logging.info(f"MongoDB results: {mongo_results}")
            return [self.convert_objectid_to_str(doc) for doc in mongo_results]
        except Exception as e:
            logging.error(f"Error fetching from MongoDB: {e}")
            return []

    def convert_objectid_to_str(self, document):
        if '_id' in document:
            document['_id'] = str(document['_id'])
        return document

    def index_data(self, document):
        try:
            document = self.convert_objectid_to_str(document)
            data = json.dumps([document]).encode('utf-8')
            headers = {
                'Content-Type': 'application/json',
                'Content-Length': len(data)
            }
            request = Request(f'{self.solr_url}/update?commit=true', data=data, headers=headers)
            connection = urlopen(request)
            response = json.load(connection)
            logging.info(f"Document {document.get('_id', 'unknown')} indexed successfully, response: {response}")
        except Exception as e:
            logging.error(f"Error indexing document {document.get('_id', 'unknown')}: {e}")

    def add_record_to_solr(self, document):
        """
        Adds a single document to the Solr index.
        """
        try:
            # Ensure the document has a unique ID for Solr if it doesn't already
            if '_id' not in document:
                document['_id'] = str(uuid.uuid4())
            document = self.convert_objectid_to_str(document)
            data = json.dumps([document]).encode('utf-8')
            headers = {
                'Content-Type': 'application/json',
                'Content-Length': len(data)
            }
            request = Request(f'{self.solr_url}/update?commit=true', data=data, headers=headers)
            connection = urlopen(request)
            response = json.load(connection)
            logging.info(f"Document {document['_id']} added successfully to Solr, response: {response}")
            return {"status": "success", "response": response}
        except Exception as e:
            logging.error(f"Error adding document {document.get('_id', 'unknown')} to Solr: {e}")
            return {"status": "error", "message": str(e)}
