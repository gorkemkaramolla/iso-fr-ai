import logging
import json
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from pymongo import MongoClient
import uuid
class SolrSearcher:
    def __init__(self, mongo_db, solr_url="http://solr:8983/solr/isoai"):
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
                # Prepare query
                fields = ["id", "name", "lastname", "title", "address", "phone", "email", "gsm", "resume", "birth_date", "iso_phone", "iso_phone2", "_id"]
                field_query = " OR ".join([f"{field}:\"{query}\"" for field in fields])
                
                # Debug the query
                logging.info(f"Search query: {field_query}")

                # Query parameters
                query_params = urlencode({
                    'q': field_query,
                    'wt': 'json',
                    'defType': 'edismax',
                    'qf': ' '.join(fields)
                })
                
                # Solr URL
                url = f'{self.solr_url}/select?{query_params}'
                logging.info(f"Connecting to Solr URL: {url}")
                
                # Perform request
                connection = urlopen(url, timeout=10)
                response = json.load(connection)
                logging.info(f"Received Solr response: {response}")

                # Process results
                results = response.get('response', {}).get('docs', [])
                if not results:
                    logging.info("No results found in Solr, attempting MongoDB search")
                    mongo_results = self.fetch_from_mongo(query)
                    return mongo_results, 200 if mongo_results else ({"error": "No results found"}, 404)

                return results, 200
            except HTTPError as e:
                logging.error(f"HTTPError during search: {e.code} {e.reason}")
                return {"error": f"HTTPError: {e.reason}", "details": e.read().decode()}, 500
            except URLError as e:
                logging.error(f"URLError during search: {e.reason}")
                return {"error": f"URLError: {e.reason}"}, 500
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
        try:
            # Ensure the document has a unique ID for Solr if it doesn't already
            if '_id' not in document:
                document['_id'] = str(uuid.uuid4())
            document = self.convert_objectid_to_str(document)
            # Ensure proper JSON format with double quotes
            data = json.dumps([document], ensure_ascii=False).encode('utf-8')
            headers = {
                'Content-Type': 'application/json',
                'Content-Length': str(len(data))
            }
            url = f'{self.solr_url}/update?commit=true'
            request = Request(url, data=data, headers=headers, method='POST')
            try:
                connection = urlopen(request)
                response = connection.read().decode('utf-8')
                response_json = json.loads(response)
                logging.info(f"Document {document['_id']} added successfully to Solr, response: {response_json}")
                return {"status": "success", "response": response_json}
            except HTTPError as e:
                error_response = e.read().decode()
                logging.error(f"Error adding document {document.get('_id', 'unknown')} to Solr: {e.code} {e.reason}")
                logging.error(f"Solr response: {error_response}")
                return {"status": "error", "message": f"{e.code} {e.reason}", "solr_response": error_response}
            except URLError as e:
                logging.error(f"Error adding document {document.get('_id', 'unknown')} to Solr: {e.reason}")
                return {"status": "error", "message": f"URLError: {e.reason}"}
        except Exception as e:
            logging.error(f"Error adding document {document.get('_id', 'unknown')} to Solr: {e}")
            return {"status": "error", "message": str(e)}
    def delete_record_from_solr(self, document_id):
        try:
            # Solr delete URL
            url = f'{self.solr_url}/update?commit=true'
            data = json.dumps({"delete": {"id": document_id}}).encode('utf-8')
            headers = {
                'Content-Type': 'application/json',
                'Content-Length': str(len(data))
            }
            request = Request(url, data=data, headers=headers, method='POST')
            connection = urlopen(request)
            response = connection.read().decode('utf-8')
            response_json = json.loads(response)
            logging.info(f"Document {document_id} deleted successfully from Solr, response: {response_json}")
            return {"status": "success", "response": response_json}
        except HTTPError as e:
            error_response = e.read().decode()
            logging.error(f"Error deleting document {document_id} from Solr: {e.code} {e.reason}")
            logging.error(f"Solr response: {error_response}")
            return {"status": "error", "message": f"{e.code} {e.reason}", "solr_response": error_response}
        except URLError as e:
            logging.error(f"Error deleting document {document_id} from Solr: {e.reason}")
            return {"status": "error", "message": f"URLError: {e.reason}"}
        except Exception as e:
            logging.error(f"Error deleting document {document_id} from Solr: {e}")
            return {"status": "error", "message": str(e)}