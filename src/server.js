const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
require('dotenv').config();

const PORT = Number(process.env.PORT || 3000);
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const MQTT_TOPIC_LED = process.env.MQTT_TOPIC_LED || 'esp32/led/set';
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || `iot-server-${Math.random().toString(16).slice(2, 10)}`;

if (!MQTT_BROKER_URL) {
  console.error('Falta configurar MQTT_BROKER_URL en el entorno.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const mqttOptions = {
  clientId: MQTT_CLIENT_ID,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  reconnectPeriod: 5000,
};

const mqttClient = mqtt.connect(MQTT_BROKER_URL, mqttOptions);
let mqttConnected = false;

mqttClient.on('connect', () => {
  mqttConnected = true;
  console.log(`Conectado a MQTT: ${MQTT_BROKER_URL}`);
});

mqttClient.on('reconnect', () => {
  mqttConnected = false;
  console.log('Reconectando a MQTT...');
});

mqttClient.on('close', () => {
  mqttConnected = false;
  console.log('Conexión MQTT cerrada.');
});

mqttClient.on('error', (error) => {
  mqttConnected = false;
  console.error('Error MQTT:', error.message);
});

function publishLedCommand(command) {
  return new Promise((resolve, reject) => {
    if (!mqttClient.connected) {
      reject(new Error('Broker MQTT no disponible'));
      return;
    }

    mqttClient.publish(MQTT_TOPIC_LED, command, { qos: 0, retain: false }, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    mqttConnected,
    mqttTopic: MQTT_TOPIC_LED,
  });
});

app.post('/encender', async (_req, res) => {
  try {
    await publishLedCommand('ON');
    res.json({ ok: true, message: 'Comando ENCENDER enviado por MQTT.' });
  } catch (error) {
    res.status(503).json({
      ok: false,
      message: 'No se pudo publicar el comando de encendido.',
      error: error.message,
    });
  }
});

app.post('/apagar', async (_req, res) => {
  try {
    await publishLedCommand('OFF');
    res.json({ ok: true, message: 'Comando APAGAR enviado por MQTT.' });
  } catch (error) {
    res.status(503).json({
      ok: false,
      message: 'No se pudo publicar el comando de apagado.',
      error: error.message,
    });
  }
});

app.use((error, _req, res, _next) => {
  console.error('Error inesperado:', error);
  res.status(500).json({
    ok: false,
    message: 'Error interno del servidor.',
  });
});

const server = app.listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});

function shutdown(signal) {
  console.log(`Recibida señal ${signal}, cerrando servidor...`);
  server.close(() => {
    mqttClient.end(true, () => {
      process.exit(0);
    });
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
