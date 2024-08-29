import logging
import json
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote_plus  # Import quote_plus
from pymongo import MongoClient
import uuid
from logger import configure_logging
import datetime


class SolrSearcher:
    def __init__(self, mongo_db, solr_url="http://solr:8983/solr/isoai"):
        self.solr_logs_url = "http://solr:8983/solr/logs"
        self.mongo_db = mongo_db
        self.mongo_collection = self.mongo_db["Personel"]
        self.solr_url = solr_url
        self.logger = configure_logging()
        logging.info(f"Initializing Solr with URL: {self.solr_url}")

    def check_connection(self):
        try:
            connection = urlopen(f"{self.solr_url}/select?q=*:*&wt=json")
            response = json.load(connection)
            logging.info(
                "Connected to Solr, status: %s", response["responseHeader"]["status"]
            )
        except Exception as e:
            logging.error("Error connecting to Solr: %s", e)
            raise

    def search(self, query):
        if not query:
            logging.error("Search query is missing.")
            return {"error": "Query parameter is missing"}, 400

        try:
            # Prepare query
            fields = [
                "id",
                "name",
                "lastname",
                "title",
                "address",
                "phone",
                "email",
                "gsm",
                "resume",
                "birth_date",
                "iso_phone",
                "iso_phone2",
                "_id",
            ]
            field_query = " OR ".join([f'{field}:"{query}"' for field in fields])

            # Debug the query
            logging.info(f"Search query: {field_query}")

            # Query parameters
            query_params = urlencode(
                {
                    "q": field_query,
                    "wt": "json",
                    "defType": "edismax",
                    "qf": " ".join(fields),
                }
            )

            # Solr URL
            url = f"{self.solr_url}/select?{query_params}"
            logging.info(f"Connecting to Solr URL: {url}")

            # Perform request
            connection = urlopen(url, timeout=10)
            response = json.load(connection)
            logging.info(f"Received Solr response: {response}")

            # Process results
            results = response.get("response", {}).get("docs", [])
            if not results:
                logging.info("No results found in Solr, attempting MongoDB search")
                mongo_results = self.fetch_from_mongo(query)
                return mongo_results, (
                    200 if mongo_results else ({"error": "No results found"}, 404)
                )

            return results, 200
        except HTTPError as e:
            logging.error(f"HTTPError during search: {e.code} {e.reason}")
            return {
                "error": f"HTTPError: {e.reason}",
                "details": e.read().decode(),
            }, 500
        except URLError as e:
            logging.error(f"URLError during search: {e.reason}")
            return {"error": f"URLError: {e.reason}"}, 500
        except Exception as e:
            logging.exception("Exception during search")
            return {"error": "An error occurred during search", "details": str(e)}, 500

    def fetch_from_mongo(self, query):
        try:
            logging.info(f"Fetching from MongoDB with query: {query}")
            mongo_results = list(
                self.mongo_collection.find({"$text": {"$search": query}})
            )
            logging.info(f"MongoDB results: {mongo_results}")
            return [self.convert_objectid_to_str(doc) for doc in mongo_results]
        except Exception as e:
            logging.error(f"Error fetching from MongoDB: {e}")
            return []

    def convert_objectid_to_str(self, document):
        if "_id" in document:
            document["_id"] = str(document["_id"])
        return document

    def index_data(self, document):
        try:
            document = self.convert_objectid_to_str(document)
            data = json.dumps([document]).encode("utf-8")
            headers = {"Content-Type": "application/json", "Content-Length": len(data)}
            request = Request(
                f"{self.solr_url}/update?commit=true", data=data, headers=headers
            )
            connection = urlopen(request)
            response = json.load(connection)
            logging.info(
                f"Document {document.get('_id', 'unknown')} indexed successfully, response: {response}"
            )
        except Exception as e:
            logging.error(
                f"Error indexing document {document.get('_id', 'unknown')}: {e}"
            )

    def add_record_to_solr(self, document):
        try:
            # Ensure the document has a unique ID for Solr if it doesn't already
            if "_id" not in document:
                document["_id"] = str(uuid.uuid4())
            document = self.convert_objectid_to_str(document)
            # Ensure proper JSON format with double quotes
            data = json.dumps([document], ensure_ascii=False).encode("utf-8")
            headers = {
                "Content-Type": "application/json",
                "Content-Length": str(len(data)),
            }
            url = f"{self.solr_url}/update?commit=true"
            request = Request(url, data=data, headers=headers, method="POST")
            try:
                connection = urlopen(request)
                response = connection.read().decode("utf-8")
                response_json = json.loads(response)
                logging.info(
                    f"Document {document['_id']} added successfully to Solr, response: {response_json}"
                )
                return {"status": "success", "response": response_json}
            except HTTPError as e:
                error_response = e.read().decode()
                logging.error(
                    f"Error adding document {document.get('_id', 'unknown')} to Solr: {e.code} {e.reason}"
                )
                logging.error(f"Solr response: {error_response}")
                return {
                    "status": "error",
                    "message": f"{e.code} {e.reason}",
                    "solr_response": error_response,
                }
            except URLError as e:
                logging.error(
                    f"Error adding document {document.get('_id', 'unknown')} to Solr: {e.reason}"
                )
                return {"status": "error", "message": f"URLError: {e.reason}"}
        except Exception as e:
            logging.error(
                f"Error adding document {document.get('_id', 'unknown')} to Solr: {e}"
            )
            return {"status": "error", "message": str(e)}

    def delete_record_from_solr(self, document_id):
        try:
            # Solr delete URL
            url = f"{self.solr_url}/update?commit=true"
            data = json.dumps({"delete": {"id": document_id}}).encode("utf-8")
            headers = {
                "Content-Type": "application/json",
                "Content-Length": str(len(data)),
            }
            request = Request(url, data=data, headers=headers, method="POST")
            connection = urlopen(request)
            response = connection.read().decode("utf-8")
            response_json = json.loads(response)
            logging.info(
                f"Document {document_id} deleted successfully from Solr, response: {response_json}"
            )
            return {"status": "success", "response": response_json}
        except HTTPError as e:
            error_response = e.read().decode()
            logging.error(
                f"Error deleting document {document_id} from Solr: {e.code} {e.reason}"
            )
            logging.error(f"Solr response: {error_response}")
            return {
                "status": "error",
                "message": f"{e.code} {e.reason}",
                "solr_response": error_response,
            }
        except URLError as e:
            logging.error(
                f"Error deleting document {document_id} from Solr: {e.reason}"
            )
            return {"status": "error", "message": f"URLError: {e.reason}"}
        except Exception as e:
            logging.error(f"Error deleting document {document_id} from Solr: {e}")
            return {"status": "error", "message": str(e)}

    def update_record_in_solr(self, data):
        try:
            # Ensure that the data contains the correct 'id' field used by Solr to identify documents
            if "id" not in data:
                if "_id" in data:
                    data["id"] = data["_id"]
                else:
                    raise ValueError(
                        "Missing 'id' or '_id' in data; this is required to update the document in Solr."
                    )

            # Convert the data to a JSON string
            json_data = json.dumps([data])  # Solr expects a list of documents

            # Construct the Solr update URL
            update_url = f"{self.solr_url}/update/json?commit=true"

            # Debug the URL and payload
            self.logger.info(
                f"Updating Solr at URL: {update_url} with data: {json_data}"
            )

            # Prepare the request
            request = Request(
                update_url,
                data=json_data.encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            # Perform the request
            with urlopen(request, timeout=10) as connection:
                response = connection.read().decode("utf-8")

            # Check response
            response_data = json.loads(response)
            if response_data.get("responseHeader", {}).get("status", 0) == 0:
                return {"status": "success"}
            else:
                error_message = response_data.get("error", {}).get(
                    "msg", "Unknown error"
                )
                self.logger.error(f"Error updating record in Solr: {error_message}")
                return {"status": "error", "message": error_message}

        except ValueError as e:
            self.logger.error(f"ValueError: {str(e)}")
            return {"status": "error", "message": str(e)}
        except HTTPError as e:
            self.logger.error(f"HTTPError during Solr update: {e.code} {e.reason}")
            return {
                "status": "error",
                "message": f"HTTPError: {e.reason}",
                "details": e.read().decode(),
            }
        except URLError as e:
            self.logger.error(f"URLError during Solr update: {e.reason}")
            return {"status": "error", "message": f"URLError: {e.reason}"}
        except Exception as e:
            self.logger.exception("Exception during Solr update")
            return {"status": "error", "message": str(e)}

    # def search_logs(
    #     self,
    #     query=None,
    #     fields=[
    #         "date",
    #         "log",
    #         "source",
    #         "id",
    #         "container_name",
    #         "container_id",
    #         "date_formatted",
    #     ],
    # ):
    #     try:
    #         # Prepare query
    #         field_query = (
    #             " OR ".join([f'{field}:"{query}"' for field in fields])
    #             if query
    #             else "*:*"
    #         )

    #         # Debug the query
    #         logging.info(f"Search query for logs: {field_query}")

    #         # Query parameters
    #         query_params = urlencode(
    #             {
    #                 "q": field_query,
    #                 "wt": "json",
    #                 "defType": "edismax",
    #                 "qf": " ".join(fields),
    #                 "rows": 1000,
    #             }
    #         )

    #         # Solr URL for logs core
    #         url = f"{self.solr_logs_url}/select?{query_params}"
    #         logging.info(f"Connecting to Solr logs URL: {url}")

    #         # Perform request
    #         connection = urlopen(url, timeout=10)
    #         response = json.load(connection)

    #         # Process results
    #         results = response.get("response", {}).get("docs", [])
    #         if not results:
    #             return {"error": "No results found"}, 404

    #         logging.info(f"Search results: {results}")
    #         return results, 200
    #     except HTTPError as e:
    #         logging.error(f"HTTPError during logs search: {e.code} {e.reason}")
    #         return {
    #             "error": f"HTTPError: {e.reason}",
    #             "details": e.read().decode(),
    #         }, 500
    #     except URLError as e:
    #         logging.error(f"URLError during logs search: {e.reason}")
    #         return {"error": f"URLError: {e.reason}"}, 500
    #     except Exception as e:
    #         logging.exception("Exception during logs search")
    #         return {
    #             "error": "An error occurred during logs search",
    #             "details": str(e),
    #         }, 500

    def convert_timestamp_to_date_string(self, timestamp):
        """Convert a 13-digit millisecond timestamp to a date string in %Y-%m-%d format."""
        date = datetime.datetime.fromtimestamp(int(timestamp) / 1000.0)
        return date.strftime("%Y-%m-%d")

    def search_logs_with_filter(
        self,
        query=None,
        single_datetime=None,
        start_date=None,
        end_date=None,
        fields=None,  # Allow fields to be passed dynamically
    ):
        try:
            # Use provided fields or default to ['log'] if not specified
            if not fields:
                fields = ["log"]

            # Prepare search query using only the provided fields
            # Ensure the search is strictly field-specific
            if query:
                field_query = " OR ".join([f"{field}:{query}" for field in fields])
            else:
                field_query = "*:*"

            # Date filtering logic remains the same
            if single_datetime:
                if len(single_datetime) == 13 and single_datetime.isdigit():
                    single_datetime = self.convert_timestamp_to_date_string(
                        single_datetime
                    )
                start_date = datetime.datetime.strptime(
                    single_datetime, "%Y-%m-%d"
                ).timestamp()
                end_date = (
                    datetime.datetime.strptime(single_datetime, "%Y-%m-%d")
                    .replace(hour=23, minute=59, second=59, microsecond=999999)
                    .timestamp()
                )
            elif start_date and end_date:
                if len(str(start_date)) == 13:
                    start_date = float(start_date) / 1000
                if len(str(end_date)) == 13:
                    end_date = float(end_date) / 1000
            else:
                start_date = None
                end_date = None

            # Construct date filter if dates are provided
            date_filter_query = ""
            if start_date and end_date:
                date_filter_query = f"date:[{int(start_date)} TO {int(end_date)}]"

            # Debug the queries
            logging.info(f"Search query for logs: {field_query}")
            logging.info(f"Date filter query for logs: {date_filter_query}")

            # Query parameters
            query_params = {
                "q": field_query,
                "wt": "json",
                "defType": "edismax",
                "q.op": "AND",  # Enforce strict matching to the fields
                "rows": 1000,
            }

            # Include date filter in query params if applicable
            if date_filter_query:
                query_params["fq"] = date_filter_query

            # Construct the Solr URL with encoded query parameters
            url = f"{self.solr_logs_url}/select?{urlencode(query_params)}"
            logging.info(f"Connecting to Solr logs URL: {url}")

            # Perform request
            connection = urlopen(url, timeout=10)
            response = json.load(connection)

            # Process results
            results = response.get("response", {}).get("docs", [])
            if not results:
                return {"error": "No results found"}, 404

            logging.info(f"Search results: {results}")
            return results, 200

        except HTTPError as e:
            logging.error(f"HTTPError during logs search: {e.code} {e.reason}")
            return {
                "error": f"HTTPError: {e.reason}",
                "details": e.read().decode(),
            }, 500
        except URLError as e:
            logging.error(f"URLError during logs search: {e.reason}")
            return {"error": f"URLError: {e.reason}"}, 500
        except Exception as e:
            logging.exception("Exception during logs search")
            return {
                "error": "An error occurred during logs search",
                "details": str(e),
            }, 500
