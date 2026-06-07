# IoT

Servidor para recibir peticiones desde Android y reenviarlas por MQTT a un ESP32.

## Qué hace

- Expone `POST /encender` y `POST /apagar`.
- Publica `ON` y `OFF` en un topic MQTT configurable.
- Incluye `GET /health` para verificar el estado del servidor.

## Requisitos

- Node.js 18 o superior.
- Un broker MQTT accesible desde el VPS.
- El ESP32 suscrito al mismo topic.

## Configuración

Copia `.env.example` a `.env` y ajusta los valores:

```bash
PORT=3000
MQTT_BROKER_URL=mqtt://127.0.0.1:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_TOPIC_LED=esp32/led/set
MQTT_CLIENT_ID=iot-server-vps
```

## Instalación

```bash
npm install
npm start
```

## Endpoints

`POST /encender`

Publica `ON` en MQTT.

`POST /apagar`

Publica `OFF` en MQTT.

`GET /health`

Devuelve si el servidor está arriba y si MQTT está conectado.

## ESP32

Tu firmware del ESP32 debe suscribirse a `esp32/led/set` y reaccionar a los mensajes `ON` y `OFF`.
