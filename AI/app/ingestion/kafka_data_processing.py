import  json
import  os
import logging
from kafka import KafkaConsumer

from app.ingestion.ingestion_pipeline import ingestion_pipeline

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
    print(event)

#     start ingestion pipeline
    res = ingestion_pipeline(event)
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



