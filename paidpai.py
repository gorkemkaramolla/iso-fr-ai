from opencv.fr import FR
from opencv.fr.persons.schemas import PersonBase
from opencv.fr.search.schemas import SearchRequest,SearchMode
BACKEND_URL = "https://eu.opencv.fr"
DEVELOPER_KEY = "7FKZCwqYWE4ZmQ3ZjQtNDhlZC00MTcwLWFiYmItMDE3MDQyZGE5ZTUx"
sdk = FR(BACKEND_URL, DEVELOPER_KEY)

# person = PersonBase([
#     "./face-images/GörkemKaramolla.jpg",
#     "./face-images/GörkemKaramolla2.jpg",
#     "./face-images/GörkemKaramolla3.jpg",
# ],
#     name = "Görkem Karamolla")
# person2 = PersonBase([
#     "./face-images/FatihYavuz.jpg",
#     "./face-images/FatihYavuz2.jpg",
#     "./face-images/FatihYavuz3.jpg",
# ],
#     name = "Fatih Yavuz")
# person = sdk.persons.create(person)
# person2 = sdk.persons.create(person2)





search_request = SearchRequest (["./face-images/muraterdal.jpg"])
result = sdk.search.search(search_request)
print(result)