from bson import ObjectId
import os
from logger import configure_logging

from bson import ObjectId
import os
from logger import configure_logging
from services.solr_search import SolrSearcher

class PersonelService:
    def __init__(self, db):
        self.IMAGE_DIRECTORY = '/app/personel_images'
        self.logger = configure_logging()
        self.db = db
        self.solr_searcher = SolrSearcher(db)
        
    def update_personel(self, personel_id, data):
            try:
                # Remove '_id' if it exists in the update data
                update_data = {k: v for k, v in data.items() if k != '_id' and v is not None}
                result = self.db["Personel"].update_one(
                    {"_id": ObjectId(personel_id)},
                    {"$set": update_data}
                )
                if result.matched_count > 0:
                    self.logger.info(f"Updated personel with id {personel_id}")
                    return {"status": "success", "message": "Personnel updated successfully"}, 200
                else:
                    self.logger.error(f"Personel with id {personel_id} not found")
                    return {"status": "error", "message": "Personel not found"}, 404
            except Exception as e:
                self.logger.error(f"Error updating personel: {e}")
                return {"status": "error", "message": str(e)}, 500
    def add_personel(self, data, file):
        os.makedirs(self.IMAGE_DIRECTORY, exist_ok=True)
        try:
            result = self.db["Personel"].insert_one(data)
            personel_id = result.inserted_id
            data['_id'] = str(personel_id)

            if file and file.filename.endswith(('.png', '.jpg', '.jpeg')):
                try:
                    filename = f"{personel_id}{os.path.splitext(file.filename)[-1]}"
                    file_path = os.path.join(self.IMAGE_DIRECTORY, filename)
                    file.save(file_path)
                    self.logger.info(f"Saved file to {file_path}")

                    self.db["Personel"].update_one(
                        {"_id": ObjectId(personel_id)}, 
                        {"$set": {"file_path": file_path}}
                    )
                    data['file_path'] = file_path
                    data['id'] = str(personel_id)

                    self.logger.info("Updated personnel data with file path")

                except Exception as e:
                    self.logger.error(f"Error saving file: {e}")
                    return {"status": "error", "message": str(e)}, 500
            else:
                self.logger.error("No valid image file provided")
                return {"status": "error", "message": "No valid image file provided"}, 400

            solr_response = self.solr_searcher.add_record_to_solr(data)

            if solr_response['status'] == 'success':
                return {"status": "success", "message": "Personnel added successfully", "file_path": file_path, "data": data, "solr_response": solr_response}, 201
            else:
                self.logger.error("Error adding data to Solr")
                return {"status": "error", "message": "Error adding data to Solr", "solr_response": solr_response}, 500

        except Exception as e:
            self.logger.error(f"Error inserting into database: {e}")
            return {"status": "error", "message": str(e)}, 500

    def get_personel_image_path(self, user_id):
        try:
            personel = self.db["Personel"].find_one({"_id": ObjectId(user_id)})
            if personel and 'file_path' in personel:
                image_path = personel['file_path']
                self.logger.info(f"Image path found in database: {image_path}")
                return image_path
            else:
                self.logger.error(f"No file_path found in database for user_id: {user_id}")
            return None
        except Exception as e:
            self.logger.error(f"Error fetching image path: {e}")
            return None

    def delete_personel(self, personel_id):
        try:
            personel = self.db["Personel"].find_one({"_id": ObjectId(personel_id)})
            if not personel:
                self.logger.error(f"Personel with id {personel_id} not found")
                return {"status": "error", "message": "Personel not found"}, 404

            # Delete the image file if it exists
            if 'file_path' in personel and os.path.exists(personel['file_path']):
                os.remove(personel['file_path'])
                self.logger.info(f"Deleted image file {personel['file_path']}")

            # Delete the document from MongoDB
            self.db["Personel"].delete_one({"_id": ObjectId(personel_id)})
            self.logger.info(f"Deleted personel with id {personel_id} from MongoDB")

            # Delete the document from Solr
            solr_response = self.solr_searcher.delete_record_from_solr(str(personel_id))

            if solr_response['status'] == 'success':
                return {"status": "success", "message": "Personel deleted successfully", "solr_response": solr_response}, 200
            else:
                self.logger.error("Error deleting data from Solr")
                return {"status": "error", "message": "Error deleting data from Solr", "solr_response": solr_response}, 500

        except Exception as e:
            self.logger.error(f"Error deleting personel: {e}")
            return {"status": "error", "message": str(e)}, 500
