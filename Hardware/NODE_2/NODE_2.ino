#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>

#define NODE_ID 2

#define TRIG_PIN       5
#define ECHO_PIN       34
#define LIGHT_PIN      18
#define PZEM_RX_PIN    16
#define PZEM_TX_PIN    17

// Node 1 STA MAC
uint8_t node1Mac[] = {0x30, 0x76, 0xF5, 0x91, 0x4B, 0x60};

#define ESPNOW_CHANNEL 6

#define DISTANCE_THRESHOLD_CM  10.0
#define LIGHT_TIMEOUT_MS       1000

#define PWM_CHANNEL     0
#define PWM_FREQ        5000
#define PWM_RESOLUTION  8
#define BRIGHTNESS_OFF   0
#define BRIGHTNESS_DIM   51
#define BRIGHTNESS_FULL  255

bool targetDetected     = false;
unsigned long lastDetectionTime = 0;
bool darkFromNode1      = false;
bool zoneOverride       = false;
String lightStatus      = "OFF";
bool espnowReady        = false;

PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);

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

NodePayload payload;
esp_now_peer_info_t peerInfo;

void onSent(const uint8_t *mac, esp_now_send_status_t status) {
  Serial.printf("Send: %s\n", status == ESP_NOW_SEND_SUCCESS ? "OK" : "FAIL");
}

void onReceive(const uint8_t *mac_addr, const uint8_t *data, int len) {
  // Print sender MAC so you can see exactly who is sending
  Serial.printf("Pkt from %02X:%02X:%02X:%02X:%02X:%02X len:%d\n",
    mac_addr[0], mac_addr[1], mac_addr[2],
    mac_addr[3], mac_addr[4], mac_addr[5], len);

  if (len == sizeof(DarkFeedback)) {
    DarkFeedback feedback;
    memcpy(&feedback, data, sizeof(feedback));
    darkFromNode1 = feedback.dark;
    Serial.printf("Dark: %s\n", darkFromNode1 ? "DARK" : "DAYLIGHT");
  } else {
    Serial.printf("Unknown size %d (expected DarkFeedback=%d)\n",
      len, sizeof(DarkFeedback));
  }
}

float getDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float distance = duration * 0.0343 / 2;
  if (duration == 0 || distance > 400) return 999.0;
  return distance;
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("\n=== NODE 2 BOOT ===");

  // PZEM
  Serial2.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);
  delay(200);

  // Pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT_PULLDOWN);
  pinMode(LIGHT_PIN, OUTPUT);
  digitalWrite(LIGHT_PIN, LOW);
  delay(200);

  // PWM
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(LIGHT_PIN, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, BRIGHTNESS_OFF);

  // WiFi STA — no connect, no scan
  WiFi.mode(WIFI_STA);
  delay(500);

  // Set channel to match Node 1
  esp_err_t ch_err = esp_wifi_set_channel(ESPNOW_CHANNEL, WIFI_SECOND_CHAN_NONE);
  Serial.printf("Channel %d: %s\n", ESPNOW_CHANNEL, ch_err == ESP_OK ? "OK" : "FAIL");

  // ESP-NOW init
  esp_err_t now_err = esp_now_init();
  if (now_err != ESP_OK) {
    Serial.printf("ESP-NOW FAILED: %d\n", now_err);
    pinMode(2, OUTPUT);
    while (true) {
      digitalWrite(2, HIGH); delay(200);
      digitalWrite(2, LOW);  delay(200);
    }
  }
  Serial.println("ESP-NOW OK");

  esp_now_register_send_cb(onSent);
  esp_now_register_recv_cb(onReceive);

  // Register Node 1 STA MAC as peer
  memset(&peerInfo, 0, sizeof(peerInfo));
  memcpy(peerInfo.peer_addr, node1Mac, 6);
  peerInfo.channel = ESPNOW_CHANNEL;
  peerInfo.encrypt = false;
  esp_now_add_peer(&peerInfo);
  Serial.printf("STA peer: %02X:%02X:%02X:%02X:%02X:%02X\n",
    node1Mac[0], node1Mac[1], node1Mac[2],
    node1Mac[3], node1Mac[4], node1Mac[5]);

  // Register Node 1 AP MAC as peer (STA MAC last byte + 1)
  uint8_t node1ApMac[6];
  memcpy(node1ApMac, node1Mac, 6);
  node1ApMac[5] = node1Mac[5] + 1;

  esp_now_peer_info_t apPeer = {};
  memcpy(apPeer.peer_addr, node1ApMac, 6);
  apPeer.channel = ESPNOW_CHANNEL;
  apPeer.encrypt = false;
  if (esp_now_add_peer(&apPeer) == ESP_OK) {
    Serial.printf("AP  peer: %02X:%02X:%02X:%02X:%02X:%02X\n",
      node1ApMac[0], node1ApMac[1], node1ApMac[2],
      node1ApMac[3], node1ApMac[4], node1ApMac[5]);
  } else {
    Serial.println("AP peer add failed");
  }

  espnowReady = true;
  Serial.println("Node 2 ready\n");
}

void loop() {
  float dist = getDistanceCM();

  if (dist <= DISTANCE_THRESHOLD_CM) {
    targetDetected = true;
    lastDetectionTime = millis();
  } else if (millis() - lastDetectionTime > LIGHT_TIMEOUT_MS) {
    targetDetected = false;
  }

  // Light control using dark flag from Node 1
  if (!zoneOverride) {
    if (darkFromNode1 && targetDetected) {
      ledcWrite(PWM_CHANNEL, BRIGHTNESS_FULL);
      lightStatus = "ON";
    } else if (darkFromNode1 && !targetDetected) {
      ledcWrite(PWM_CHANNEL, BRIGHTNESS_DIM);
      lightStatus = "DIM";
    } else {
      ledcWrite(PWM_CHANNEL, BRIGHTNESS_OFF);
      lightStatus = "OFF";
    }
  }

  strncpy(payload.light, lightStatus.c_str(), 3);
  payload.light[3] = '\0';

  // Energy measurement
  float r_v = pzem.voltage();
  float r_c = pzem.current();
  float r_p = pzem.power();

  payload.nodeId   = NODE_ID;
  payload.distance = (dist > 200) ? 999 : dist;
  payload.dark     = darkFromNode1;
  payload.voltage  = isnan(r_v) ? 0.0 : r_v;
  payload.current  = isnan(r_c) ? 0.0 : r_c;
  payload.power    = isnan(r_p) ? 0.0 : r_p;
  payload.uptime   = millis() / 1000;

  Serial.printf("Dist:%.1f | Dark:%d | Light:%s | %.2fV | %.3fA | %.3fW\n",
    dist, darkFromNode1, lightStatus.c_str(),
    payload.voltage, payload.current, payload.power);

  if (espnowReady) {
    esp_now_send(node1Mac, (uint8_t *)&payload, sizeof(payload));
  }

  delay(2000);
}
