import  json
import  os
import logging
from kafka import KafkaConsumer

from services.ingestion_pipeline import  ingestion_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TOPIC = "document.uploaded"

consumer = KafkaConsumer(
    TOPIC,
    bootstrap_servers=os.getenv(
        "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"
    ),
    group_id="onboardiq-ai-service",
    auto_offset_reset="earliest",
    enable_auto_commit=False,
    value_deserializer=lambda value: json.loads(value.decode("utf-8")),
)


def process_document(event: dict):
    """
    Process the document uploaded event.
    TODO: Implement PDF ingestion, chunking, embeddings, and Qdrant storage.
    """
    document_id = event.get("documentId")
    version_id = event.get("versionId")
    storage_key = event.get("storageKey")

    if not document_id or not version_id or not storage_key:
        raise ValueError("Invalid document event: required fields are missing")

    logger.info("Received document upload event")
    logger.info("Document ID: %s", document_id)
    logger.info("Version ID: %s", version_id)
    logger.info("Storage key: %s", storage_key)

    # Next: Download PDF -> Extract text -> Chunk -> Embed -> Store in Qdrant

    res =  ingestion_pipeline(document_id)

    print(res)






def start_consumer():
    logger.info("Kafka consumer started")
    logger.info("Listening to topic: %s", TOPIC)

    try:
        for message in consumer:
            try:
                process_document(message.value)

                # Commit only after successful processing
                consumer.commit()
                logger.info("Document event processed successfully")

            except Exception:
                logger.exception("Failed to process Kafka message")

                # Stop so a later message cannot accidentally commit
                # past this failed message.
                break

    except KeyboardInterrupt:
        logger.info("Kafka consumer stopped")

    finally:
        consumer.close()
        logger.info("Kafka consumer connection closed")



