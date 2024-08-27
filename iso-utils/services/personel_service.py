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
            
            
    
            
            
    def update_personel(self, personel_id, data, file=None):
        os.makedirs(self.IMAGE_DIRECTORY, exist_ok=True)  # Ensure directory exists
        try:
            # Prepare the update data, excluding the '_id'
            update_data = {k: v for k, v in data.items() if k != '_id' and v is not None}

            # If a new image file is provided, save it
            if file and file.filename.endswith(('.png', '.jpg', '.jpeg')):
                try:    
                    filename = f"{personel_id}{os.path.splitext(file.filename)[-1]}"
                    file_path = os.path.join(self.IMAGE_DIRECTORY, filename)
                    file.save(file_path)
                    self.logger.info(f"Saved file to {file_path}")

                    # Update the file path in the database
                    update_data['file_path'] = file_path

                except Exception as e:
                    self.logger.error(f"Error saving file: {e}")
                    return {"status": "error", "message": str(e)}, 500

            # Perform the update operation in the MongoDB database
            result = self.db["Personel"].update_one(
                {"_id": ObjectId(personel_id)},
                {"$set": update_data}
            )

            if result.matched_count == 0:
                self.logger.error(f"No personel found with ID: {personel_id}")
                return {"status": "error", "message": "Personel not found"}, 404

            self.logger.info(f"Updated personel with id {personel_id}")

            # Retrieve the full updated record to send to Solr
            updated_personel = self.db["Personel"].find_one({"_id": ObjectId(personel_id)})

            if updated_personel:
                updated_personel['_id'] = str(updated_personel['_id'])  # Convert ObjectId to string
                try:
                    solr_response = self.solr_searcher.update_record_in_solr(updated_personel)
                    
                    # iso_fr_url = f"http://face_recognition_service:5004/update_database_with_id"
                    # response = requests.post(iso_fr_url, json={{"personnel_id":updated_personel['_id']}} proxies={"http": None, "https": None})
                    # response.raise_for_status()  # Raise an HTTPError for bad responses
                    # personnel_record = response.json()
                    
                    
                    
                except Exception as e:
                    self.logger.error(f"Error updating Solr: {e}")
                    return {"status": "error", "message": "Error updating Solr", "solr_response": str(e)}, 500

                if solr_response.get('status') == 'success':
                    return {"status": "success", "message": "Personnel updated successfully in both MongoDB and Solr"}, 200
                else:
                    self.logger.error("Error updating data in Solr")
                    return {"status": "error", "message": "Error updating data in Solr", "solr_response": solr_response}, 500
            else:
                self.logger.error(f"Personel with id {personel_id} could not be retrieved after update")
                return {"status": "error", "message": "Personnel could not be retrieved after update"}, 500

        except Exception as e:
            self.logger.error(f"Error updating personel: {e}", exc_info=True)
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
    def get_all_personel_image_paths(self):
        try:
            personel_images = []
            all_personel = self.db["Personel"].find({"file_path": {"$exists": True}})  # Fetch all documents with a file_path
            
            for personel in all_personel:
                if 'file_path' in personel:
                    image_path = personel['file_path']
                    personel_name = f'{personel["name"]} {personel["lastname"]}'
                    personel_images.append({"name": personel_name, "image_path": image_path})
                    self.logger.info(f"Image path found in database: {image_path}")
                else:
                    self.logger.warning(f"No file_path found for personel with _id: {personel.get('_id')}")
            
            return personel_images if personel_images else None

        except Exception as e:
            self.logger.error(f"Error fetching image paths: {e}")
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
