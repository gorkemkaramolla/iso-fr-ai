import os
from pymongo import MongoClient
from bson import ObjectId
from elasticsearch import Elasticsearch, RequestsHttpConnection
from elasticsearch_dsl import Search
import logging
from flask import Flask, request, jsonify
import urllib3

class ElasticSearcher:
    def __init__(self, mongo_client, mongo_db, es_host="http://localhost:9200"):
        self.mongo_client = mongo_client
        self.mongo_db = mongo_db
        self.mongo_collection = self.mongo_db["Personel"]
        self.es_host = es_host
        
        # Disable SSL warnings
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        self.es_client = Elasticsearch(
            hosts=[{'host': 'localhost', 'port': 9200}],
            use_ssl=False,  # Set to True if using SSL
            verify_certs=False,  # Disable certificate verification
            connection_class=RequestsHttpConnection,
        )

        self.create_index()
        self.check_connection()
        self.create_text_index()

    def create_text_index(self):
        self.mongo_collection.create_index([("ADI", "text"), ("SOYADI", "text")])

    def check_connection(self):
        try:
            if not self.es_client.ping():
                logging.error("Connection to Elasticsearch failed")
                raise ValueError("Connection to Elasticsearch failed")
            logging.info("Connected to Elasticsearch")
        except Exception as e:
            logging.error(f"Error connecting to Elasticsearch: {e}")
            raise

    def create_index(self):
        index_body = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            },
            "mappings": {
                "properties": {
                    "ADI": {"type": "text"},
                    "PERSONEL_ID": {"type": "keyword"},
                    "SOYADI": {"type": "text"},  # Assuming you might also need to search by surname
                    # Additional fields can be added here
                }
            }
        }
        if not self.es_client.indices.exists(index="personel_index"):
            self.es_client.indices.create(index="personel_index", body=index_body)
            logging.info("Created Elasticsearch index 'personel_index'")
        else:
            logging.info("Elasticsearch index 'personel_index' already exists")

    def search(self, query):
        if not query:
            return {"error": "Query parameter is missing"}, 400

        s = Search(using=self.es_client, index='personel_index').query("multi_match", query=query, fields=['ADI', 'PERSONEL_ID'])
        response = s.execute()

        results = [hit.to_dict() for hit in response]

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
            self.es_client.index(index='personel_index', id=document['_id'], document=document)
            logging.info(f"Document {document['_id']} indexed successfully")
        except Exception as e:
            logging.error(f"Error indexing document {document['_id']}: {e}")