#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>

// ===== WIFI & MQTT =====
const char* ssid        = "Vodacom_9110";
const char* password    = "Eliza@24";
const char* mqtt_server = "192.168.0.47";

const char* topic_node1 = "streetlight/node1";
const char* topic_node2 = "streetlight/node2";
const char* topic_node3 = "streetlight/node3";

// ===== PINS =====
#define LDR_PIN        35
#define TRIG_PIN        5
#define ECHO_PIN       34
#define LIGHT_PIN      18
#define PZEM_RX_PIN    16
#define PZEM_TX_PIN    17

#define DISTANCE_THRESHOLD_CM  10.0
#define LIGHT_TIMEOUT_MS       1000

// ===== PWM CONFIG =====
#define PWM_CHANNEL     0
#define PWM_FREQ        5000
#define PWM_RESOLUTION  8
#define BRIGHTNESS_OFF   0
#define BRIGHTNESS_DIM   51
#define BRIGHTNESS_FULL  255

// ===== NODE 2 & 3 MAC ADDRESSES =====
uint8_t node2Mac[] = {0x30, 0x76, 0xF5, 0x91, 0x21, 0xB4};
uint8_t node3Mac[] = {0x8C, 0x94, 0xDF, 0x4C, 0xFA, 0xD4};

WiFiClient espClient;
PubSubClient client(espClient);
PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);

bool targetDetected      = false;
unsigned long lastDetectionTime = 0;
bool darkDetected        = false;
String lightStatus       = "OFF";
bool zoneOverride        = false;
uint8_t wifiChannel      = 6; // default, updated after WiFi connects

typedef struct {
  int   nodeId;
  float distance;
  bool  dark;
  char  light[4];
  float voltage;
  float current;
  float power;
  long  uptime;
} NodePayload;

typedef struct {
  bool dark;
} DarkFeedback;

NodePayload node2Data;
NodePayload node3Data;
bool node2Updated = false;
bool node3Updated = false;

// ===== ESP-NOW RECEIVE =====
void onReceive(const uint8_t *mac_addr, const uint8_t *data, int len) {
  // Print every packet received so we can debug
  Serial.printf("ESP-NOW RX from %02X:%02X:%02X:%02X:%02X:%02X len:%d\n",
    mac_addr[0], mac_addr[1], mac_addr[2],
    mac_addr[3], mac_addr[4], mac_addr[5], len);

  // Accept NodePayload from Node 2 and Node 3
  if (len == sizeof(NodePayload)) {
    NodePayload incoming;
    memcpy(&incoming, data, sizeof(incoming));
    incoming.dark = darkDetected; // stamp with real LDR reading

    if (incoming.nodeId == 2) {
      node2Data    = incoming;
      node2Updated = true;
      Serial.printf("Node 2 | Dist:%.1f | Light:%s | V:%.1f\n",
        incoming.distance, incoming.light, incoming.voltage);
    } else if (incoming.nodeId == 3) {
      node3Data    = incoming;
      node3Updated = true;
      Serial.printf("Node 3 | Dist:%.1f | Light:%s | V:%.1f\n",
        incoming.distance, incoming.light, incoming.voltage);
    } else {
      Serial.printf("Unknown nodeId: %d\n", incoming.nodeId);
    }
  } else {
    Serial.printf("Unexpected size: %d (NodePayload=%d DarkFeedback=%d)\n",
      len, sizeof(NodePayload), sizeof(DarkFeedback));
  }
}

float getDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float dist = duration * 0.0343 / 2;
  if (duration == 0 || dist > 400) return 999.0;
  return dist;
}

void setup_wifi() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500); Serial.print("."); attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    wifiChannel = WiFi.channel();
    Serial.println("\nWiFi OK");
    Serial.print("IP: "); Serial.println(WiFi.localIP());
    Serial.printf("WiFi Channel: %d\n", wifiChannel);
  } else {
    Serial.println("\nWiFi FAIL");
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

  StaticJsonDocument<128> cmd;
  deserializeJson(cmd, msg);
  String command = cmd["command"].as<String>();

  Serial.printf("MQTT cmd [%s]: %s\n", topic, command.c_str());

  if (command == "ON") {
    zoneOverride = true;
    ledcWrite(PWM_CHANNEL, BRIGHTNESS_FULL);
    lightStatus = "ON";
  } else if (command == "OFF") {
    zoneOverride = true;
    ledcWrite(PWM_CHANNEL, BRIGHTNESS_OFF);
    lightStatus = "OFF";
  } else if (command == "BRIGHTNESS") {
    int dashValue = cmd["value"].as<int>();
    int pwmValue  = map(dashValue, 0, 100, 0, 255);
    zoneOverride  = true;
    ledcWrite(PWM_CHANNEL, pwmValue);
    lightStatus   = (pwmValue > 0) ? "ON" : "OFF";
  } else if (command == "AUTO") {
    zoneOverride = false;
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.println("Connecting MQTT...");
    if (client.connect("ESP32Node1Gateway")) {
      Serial.println("MQTT OK");
      client.subscribe("streetlight/zone1/command");
      client.subscribe("streetlight/zone2/command");
      client.subscribe("streetlight/zone3/command");
    } else {
      Serial.printf("MQTT failed rc=%d\n", client.state());
      delay(2000);
    }
  }
}

void publishNode(const char* topic, int nodeId, float distance, bool dark,
                 const char* light, float voltage, float current,
                 float power, long uptime) {
  StaticJsonDocument<256> doc;
  doc["nodeId"]   = nodeId;
  doc["distance"] = (distance > 200) ? 999 : distance;
  doc["dark"]     = dark;
  doc["light"]    = light;
  doc["voltage"]  = voltage;
  doc["current"]  = current;
  doc["power"]    = power;
  doc["uptime"]   = uptime;

  char buffer[256];
  serializeJson(doc, buffer);
  bool ok = client.publish(topic, buffer);
  Serial.printf("Pub %s [%s]\n", topic, ok ? "OK" : "FAIL");
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n=== NODE 1 GATEWAY ===");

  Serial2.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);
  delay(200);

  pinMode(LDR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT_PULLDOWN);
  pinMode(LIGHT_PIN, OUTPUT);
  digitalWrite(LIGHT_PIN, LOW);
  delay(200);

  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(LIGHT_PIN, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, BRIGHTNESS_OFF);

  // WiFi first — sets wifiChannel
  setup_wifi();

  Serial.print("STA MAC: "); Serial.println(WiFi.macAddress());
  Serial.print("AP  MAC: "); Serial.println(WiFi.softAPmacAddress());

  // ESP-NOW init
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW FAILED");
    return;
  }
  Serial.println("ESP-NOW OK");
  esp_now_register_recv_cb(onReceive);

  // ===== REGISTER NODE 2 =====
  esp_now_peer_info_t peer2 = {};
  memcpy(peer2.peer_addr, node2Mac, 6);
  peer2.channel = wifiChannel;
  peer2.encrypt = false;
  if (esp_now_add_peer(&peer2) == ESP_OK) {
    Serial.printf("Node 2 peer OK ch:%d MAC:%02X:%02X:%02X:%02X:%02X:%02X\n",
      wifiChannel,
      node2Mac[0], node2Mac[1], node2Mac[2],
      node2Mac[3], node2Mac[4], node2Mac[5]);
  } else {
    Serial.println("Node 2 peer FAILED");
  }

  // ===== REGISTER NODE 3 =====
  esp_now_peer_info_t peer3 = {};
  memcpy(peer3.peer_addr, node3Mac, 6);
  peer3.channel = wifiChannel;
  peer3.encrypt = false;
  if (esp_now_add_peer(&peer3) == ESP_OK) {
    Serial.printf("Node 3 peer OK ch:%d MAC:%02X:%02X:%02X:%02X:%02X:%02X\n",
      wifiChannel,
      node3Mac[0], node3Mac[1], node3Mac[2],
      node3Mac[3], node3Mac[4], node3Mac[5]);
  } else {
    Serial.println("Node 3 peer FAILED");
  }

  client.setServer(mqtt_server, 1883);
  client.setCallback(mqttCallback);

  Serial.println("Node 1 ready\n");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) setup_wifi();
  if (!client.connected()) reconnect();
  client.loop();

  // ===== SENSORS =====
  int ldrValue = analogRead(LDR_PIN);
  darkDetected = (ldrValue > 2500);

  float dist = getDistanceCM();

  if (dist <= DISTANCE_THRESHOLD_CM) {
    targetDetected = true;
    lastDetectionTime = millis();
  } else if (millis() - lastDetectionTime > LIGHT_TIMEOUT_MS) {
    targetDetected = false;
  }

  // ===== SEND DARK FLAG TO NODE 2 AND NODE 3 =====
  DarkFeedback feedback;
  feedback.dark = darkDetected;
  esp_err_t r2 = esp_now_send(node2Mac, (uint8_t *)&feedback, sizeof(feedback));
  esp_err_t r3 = esp_now_send(node3Mac, (uint8_t *)&feedback, sizeof(feedback));
  Serial.printf("Dark send → N2:%s N3:%s\n",
    r2 == ESP_OK ? "OK" : "ERR",
    r3 == ESP_OK ? "OK" : "ERR");

  // ===== LIGHT CONTROL =====
  if (!zoneOverride) {
    if (darkDetected && targetDetected) {
      ledcWrite(PWM_CHANNEL, BRIGHTNESS_FULL);
      lightStatus = "ON";
    } else if (darkDetected && !targetDetected) {
      ledcWrite(PWM_CHANNEL, BRIGHTNESS_DIM);
      lightStatus = "DIM";
    } else {
      ledcWrite(PWM_CHANNEL, BRIGHTNESS_OFF);
      lightStatus = "OFF";
    }
  }

  // ===== ENERGY =====
  float r_v   = pzem.voltage();
  float r_c   = pzem.current();
  float r_p   = pzem.power();
  float voltage = isnan(r_v) ? 0.0 : r_v;
  float current = isnan(r_c) ? 0.0 : r_c;
  float power   = isnan(r_p) ? 0.0 : r_p;

  Serial.printf("LDR:%d | Dist:%.1f | Dark:%d | Light:%s | %.2fV | %.3fA | %.3fW\n",
    ldrValue, dist, darkDetected, lightStatus.c_str(), voltage, current, power);

  // ===== PUBLISH =====
  publishNode(topic_node1, 1, dist, darkDetected,
              lightStatus.c_str(), voltage, current, power, millis() / 1000);

  if (node2Updated) {
    publishNode(topic_node2, 2,
                node2Data.distance, node2Data.dark, node2Data.light,
                node2Data.voltage, node2Data.current, node2Data.power,
                node2Data.uptime);
    node2Updated = false;
  }

  if (node3Updated) {
    publishNode(topic_node3, 3,
                node3Data.distance, node3Data.dark, node3Data.light,
                node3Data.voltage, node3Data.current, node3Data.power,
                node3Data.uptime);
    node3Updated = false;
  }

  delay(2000);
}
