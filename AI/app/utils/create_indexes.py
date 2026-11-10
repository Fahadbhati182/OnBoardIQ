from dotenv import load_dotenv
load_dotenv()

from qdrant_client import  models
from app.utils.qdrant import qdrant_client,COLLECTION_NAME



payload_indexes = {
    "metadata.access_scope": models.PayloadSchemaType.KEYWORD,
    "metadata.department_id": models.PayloadSchemaType.KEYWORD,
    "metadata.document_type": models.PayloadSchemaType.KEYWORD,
    "metadata.team_id": models.PayloadSchemaType.KEYWORD,
}

for field, schema in payload_indexes.items():
    qdrant_client.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name=field,
        field_schema=schema,
        wait=True
    )

print("Payload indexes created successfully!")