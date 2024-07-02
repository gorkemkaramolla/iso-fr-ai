import solr
import logging

class SolrSearcher:
    def __init__(self, mongo_client, mongo_db, solr_url="http://localhost:8983/solr"):
        self.mongo_client = mongo_client
        self.mongo_db = mongo_db
        self.mongo_collection = self.mongo_db["Personel"]
        self.solr = solr.Solr(solr_url)

    def create_text_index(self):
        # Assuming you have already set up the Solr schema via Solr admin or config files.
        pass

    def check_connection(self):
        try:
            response = self.solr.select('q=*:*')
            logging.info("Connected to Solr, status: %s", response.status)
        except Exception as e:
            logging.error("Error connecting to Solr: %s", e)
            raise

    def create_index(self):
        # In Solr, this typically would be handled via Solr admin or during initial setup, not in code.
        pass

    def search(self, query):
        if not query:
            return {"error": "Query parameter is missing"}, 400

        response = self.solr.select(f'q=ADI:{query} OR PERSONEL_ID:{query}')
        results = [hit for hit in response.results]

        if not results:
            mongo_results = self.fetch_from_mongo(query)
            if mongo_results:
                for document in mongo_results:
                    self.index_data(document)
                return mongo_results
            else:
                return {"error": "No results found"}, 404

        return results

    def fetch_from_mongo(self, query):
        mongo_results = list(self.mongo_collection.find({"$text": {"$search": query}}))
        return [self.convert_objectid_to_str(doc) for doc in mongo_results]

    def convert_objectid_to_str(self, document):
        document['_id'] = str(document['_id'])
        return document

    def index_data(self, document):
        try:
            document = self.convert_objectid_to_str(document)
            self.solr.add([document], commit=True)
            logging.info(f"Document {document['_id']} indexed successfully")
        except Exception as e:
            logging.error(f"Error indexing document {document['_id']}: {e}")
