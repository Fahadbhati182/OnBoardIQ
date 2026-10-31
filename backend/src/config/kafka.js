import "dotenv/config";
import { Kafka } from "kafkajs";

const clientID = process.env.KAFKA_CLIENT_ID;
const broker = process.env.KAFKA_DOMAIN;

const kafkaClient = new Kafka({
  clientId: clientID,
  brokers: [broker],
});

const producer = kafkaClient.producer();

export const sendKafkaMessage = async (topic, message) => {
  try {
    await producer.connect();

    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
  } catch (error) {
    console.error("Kafka message sending failed:", error);
    throw error;
  } finally {
    await producer.disconnect();
  }
};

export default kafkaClient;
