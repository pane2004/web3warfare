#define IR_SEND_PIN 23
#include <IRremote.hpp>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>

// CONFIG: MODIFY VALUES TO FIT PLAY STYLE
int maxHealth = 10;                // maximum health points
int maxAmmo = 9;                   // 9 will be not connected to wifi indicator, max ammo will be 8
int shootCooldown = 500;           // interval between each shot (in ms)
int reloadTime = 1600;             // time it takes to reload the gun (in ms)
const int resetTime = 500;         // time the reset button has to be pressed to reset (in ms)
const int hitIndicatorTime = 200;  // time the hit indicator LED turns off when getting shot at (in ms)
bool canRunGame = false;
bool diedFlag = false;
String battleContract;
String userAddress;
const String privateKey = "dfsdfsf"; // change this per device

// pins
byte triggerPin = 4;
byte reloadPin = 16;
byte resetPin = 17;
byte receiverPin = 27;
byte greenPin = 0;
byte hitLedPin = 13;
byte buzzerPin = 26;
byte irPin = 23;
byte redPin = 2;
byte bluePin = 15;

byte pinsSegments[7] = { 25, 33, 21, 22, 14, 32, 19 };

// IR communication
const unsigned long irSendHex = 0xFFA25D;  // define hex value to send

// arrays of digits for 7 segment display
bool digits[10][7] = {
  { 1, 1, 1, 1, 1, 1, 0 },
  { 0, 1, 1, 0, 0, 0, 0 },
  { 1, 1, 0, 1, 1, 0, 1 },
  { 1, 1, 1, 1, 0, 0, 1 },
  { 0, 1, 1, 0, 0, 1, 1 },
  { 1, 0, 1, 1, 0, 1, 1 },
  { 1, 0, 1, 1, 1, 1, 1 },
  { 1, 1, 1, 0, 0, 0, 0 },
  { 1, 1, 1, 1, 1, 1, 1 },
  { 1, 1, 1, 1, 0, 1, 1 }
};

// reload animation on 7 segment display
bool reloadAnimation[6][7] = {
  { 0, 1, 1, 1, 1, 1, 1 },
  { 1, 0, 1, 1, 1, 1, 1 },
  { 1, 1, 0, 1, 1, 1, 1 },
  { 1, 1, 1, 0, 1, 1, 1 },
  { 1, 1, 1, 1, 0, 1, 1 },
  { 1, 1, 1, 1, 1, 0, 1 }
};
const int animationLength = 6;
const int animationInterval = 100;

// array of colors to display health on RGB LED
const byte healthColors[11][3] = {
  { 0, 0, 0 },
  { 255, 0, 0 },
  { 255, 10, 0 },
  { 255, 20, 0 },
  { 255, 30, 0 },
  { 255, 50, 0 },
  { 255, 86, 0 },
  { 255, 122, 0 },
  { 255, 186, 0 },
  { 202, 255, 0 },
  { 0, 255, 0 }
};

// melody to play when being hit
const int hitMelody[2] = {
  500,
  600
};
const int melodyLength = 2;
const int melodyInterval = 150;

// shoot sound effect
const int shootSoundStartTone = 1000;
const int shootSoundEndTone = 700;
const int shootSoundInterval = 1;

// other variables
int health = maxHealth;
int ammoCount = maxAmmo;
bool alive = true;
unsigned long lastShot = shootCooldown * -1;
unsigned long startedReload = reloadTime * -1;
bool reloading = false;
unsigned long startedResetting = 0;
bool resetting = false;
unsigned long millisStartedTone = 0;
bool playingMelody = false;
int currentToneIdx = 0;
bool playingShootSound = false;
unsigned long millisStartedFrame = 0;
int currentFrameIdx = 0;
unsigned long millisStartedHit = 0;
bool hitIndicator = false;

// reset function
void (*reset)(void) = 0;

// function to display digits on the 7 segment display
void displaySegments(bool segments[7]) {
  for (byte seg = 0; seg < 7; seg += 1) {
    digitalWrite(pinsSegments[seg], segments[seg]);
  }
}

// function to display health on the rgb led
void displayHealth(int hp) {
  analogWrite(redPin, healthColors[hp][0]);
  analogWrite(greenPin, healthColors[hp][1]);
  analogWrite(bluePin, healthColors[hp][2]);
}

void playGameOverSound() {
  int gameOverTones[] = { 622, 587, 554, 523 };
  for (int i = 0; i < 4; i++) {
    if (i < 3) {
      tone(buzzerPin, gameOverTones[i]);
      delay(300);
      noTone(buzzerPin);
    } else {
      // make the sound wavy
      for (int i2 = 0; i2 < 10; i2++) {
        for (int pitch = -10; pitch <= 10; pitch++) {
          tone(buzzerPin, gameOverTones[i] + pitch);
          delay(5);
        }
      }
      noTone(buzzerPin);
    }
  }
}

// wifi connection
const char* ssid = "Alex the iPhone 2.0";
const char* password = "ethglobalsf";

String get_wifi_status(int status) {
  switch (status) {
    case WL_IDLE_STATUS:
      return "WL_IDLE_STATUS";
    case WL_SCAN_COMPLETED:
      return "WL_SCAN_COMPLETED";
    case WL_NO_SSID_AVAIL:
      return "WL_NO_SSID_AVAIL";
    case WL_CONNECT_FAILED:
      return "WL_CONNECT_FAILED";
    case WL_CONNECTION_LOST:
      return "WL_CONNECTION_LOST";
    case WL_CONNECTED:
      return "WL_CONNECTED";
    case WL_DISCONNECTED:
      return "WL_DISCONNECTED";
  }
}

// http connection
const char* serverName = "http://172.20.10.2:3001/init";

unsigned long lastTime = 0;
unsigned long timerDelay = 5000;

String httpGETRequest(const char* serverName) {
  WiFiClient client;
  HTTPClient http;

  // Your Domain name with URL path or IP address with path
  http.begin(client, serverName);

  // If you need Node-RED/server authentication, insert user and password below
  //http.setAuthorization("REPLACE_WITH_SERVER_USERNAME", "REPLACE_WITH_SERVER_PASSWORD");

  // Send HTTP POST request
  int httpResponseCode = http.GET();

  String payload = "{}";

  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    payload = http.getString();
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
  // Free resources
  http.end();

  return payload;
}

void httpPOSTRequest(const char* serverName, String& userAddress, String& battleContract) {
  WiFiClient client;
  HTTPClient http;

  // Your Domain name with URL path or IP address with path
  http.begin(client, serverName);

  // Specify the content type for the request
  http.addHeader("Content-Type", "application/json");

  // JSON payload
  String postData = "{\"userAddress\":\"" + userAddress + "\",\"battleContract\":\"" + battleContract + "\"}";

  // Send the POST request
  int httpResponseCode = http.POST(postData);

  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }

  // Free resources
  http.end();
}

void setup() {
  // setup pins
  pinMode(triggerPin, INPUT_PULLUP);
  pinMode(reloadPin, INPUT_PULLUP);
  pinMode(resetPin, INPUT_PULLUP);
  pinMode(irPin, OUTPUT);
  pinMode(hitLedPin, OUTPUT);
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  for (byte i = 0; i < 7; i += 1) {
    pinMode(pinsSegments[i], OUTPUT);
  }

  // start IR receivers
  IrReceiver.begin(27, 0);
  IrSender.begin();

  // GAME SETUP
  displaySegments(digits[ammoCount]);  // display ammo count
  displayHealth(health);               // display health
  digitalWrite(hitLedPin, HIGH);       // turn on hit indicator LED

  // play startup sound effect
  int startTones[] = { 196, 262, 330, 392 };
  for (int i = 0; i < 4; i++) {
    tone(buzzerPin, startTones[i]);
    delay(200);
  }
  noTone(buzzerPin);

  // wifi connection
  Serial.begin(115200);
  delay(1000);
  int status = WL_IDLE_STATUS;
  Serial.println("\nConnecting");
  Serial.println(get_wifi_status(status));
  WiFi.begin(ssid, password);
  while (status != WL_CONNECTED) {
    delay(500);
    status = WiFi.status();
    Serial.println(get_wifi_status(status));
  }

  Serial.println("\nConnected to the WiFi network");
  Serial.print("Local ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  unsigned long currentMillis = millis();
  // start by making init call
  if (!canRunGame && WiFi.status() == WL_CONNECTED) {
    String initialization;
    initialization = httpGETRequest("http://172.20.10.2:3001/init");
    JSONVar init = JSON.parse(initialization);

    maxHealth = int(init["maxHealth"]);
    maxAmmo = int(init["maxAmmo"]);
    ammoCount = maxAmmo;
    shootCooldown = int(init["shootCooldown"]);
    reloadTime = int(init["reloadTime"]);
    battleContract = String(init["battleContract"]);
    userAddress = String(init["userAddress"]);
    bool play = bool(init["play"]);
    if (play) {
      canRunGame = true;
      diedFlag = false;
    }
  }
  alive = health > 0;

  // display ammo count
  if (!reloading) {
    displaySegments(digits[ammoCount]);
  }

  // display health
  displayHealth(health);

  // play sounds
  if (playingMelody) {
    if (currentMillis - millisStartedTone >= melodyInterval) {  // we are playing a melody, check if we finished playing current tone
      if (currentToneIdx + 1 == melodyLength) {                 // we finished playing a tone, check if we finished the melody
        // end of melody
        noTone(buzzerPin);
        playingMelody = false;

        // if dead play game over sound
        if (!alive) {
          delay(100);
          playGameOverSound();
        }
      } else {  // we haven't finished the melody
        // play next tone
        currentToneIdx++;
        millisStartedTone = currentMillis;
        tone(buzzerPin, hitMelody[currentToneIdx]);
      }
    }
  } else if (playingShootSound) {
    if (currentMillis - millisStartedTone >= shootSoundInterval) {
      if (currentToneIdx <= shootSoundEndTone) {
        // end of melody
        noTone(buzzerPin);
        playingShootSound = false;

      } else {
        // play next tone
        currentToneIdx -= 1;
        millisStartedTone = currentMillis;
        tone(buzzerPin, currentToneIdx);
      }
    }
  }

  // play reload animation
  if (reloading) {

    if (currentMillis - millisStartedFrame >= animationInterval) {  // we are playing reload animation, check if we finished playing current frame
      // play next frame
      currentFrameIdx++;
      // cycle to start if reached end of animation
      if (currentFrameIdx > animationLength - 1) {
        currentFrameIdx = 0;
      }
      millisStartedFrame = currentMillis;
      displaySegments(reloadAnimation[currentFrameIdx]);
    }
  }

  // check if hit indicator LED has been off for enough time (only if still alive)
  if (hitIndicator && currentMillis - millisStartedHit >= hitIndicatorTime && alive) {
    hitIndicator = false;
    digitalWrite(hitLedPin, HIGH);  // turn LED back on
  }

  // input: reset
  if (digitalRead(resetPin) == LOW) {
    if (resetting) {                                        // check if we were already holding the reset button
      if (currentMillis - startedResetting >= resetTime) {  // check if we held the reset button for enough time
        reset();
      }
    } else {  // start a new timer when we press it
      startedResetting = currentMillis;
      resetting = true;
    }
  } else {
    resetting = false;
  }

  // stop here if dead
  if (!alive) {
    if (!diedFlag) {
      httpPOSTRequest("http://172.20.10.2:3001/died", userAddress, battleContract);
      diedFlag = true;
      canRunGame = false;
    }
    return;
  }

  // input: shoot
  if (digitalRead(triggerPin) == LOW && ammoCount > 0 && !reloading && currentMillis - lastShot >= shootCooldown && canRunGame) {
    // SHOOT
    IrSender.sendNEC(irSendHex, 32);  // send IR
    IrReceiver.restartAfterSend();    // restart IR receiver

    ammoCount--;
    lastShot = currentMillis;

    // SHOOT SFX
    currentToneIdx = shootSoundStartTone;
    millisStartedTone = currentMillis;
    tone(buzzerPin, currentToneIdx);
    if (playingMelody) {
      playingMelody = false;
    }
    playingShootSound = true;
  }

  // input: reload
  if (digitalRead(reloadPin) == LOW && ammoCount < maxAmmo && !reloading) {
    reloading = true;
    startedReload = currentMillis;

    // RELOAD ANIMATION
    currentFrameIdx = 0;
    millisStartedFrame = currentMillis;
    displaySegments(reloadAnimation[currentFrameIdx]);
  }

  // reload gun
  if (reloading && currentMillis - startedReload >= reloadTime) {
    ammoCount = maxAmmo;
    reloading = false;
  }

  // check if receiving IR signal (getting shot)
  if (IrReceiver.decode()) {
    IrReceiver.resume();  // resume to receive other values
    health--;             // lose hp

    // hit indicator LED
    hitIndicator = true;
    digitalWrite(hitLedPin, LOW);  // turn LED off
    millisStartedHit = currentMillis;

    // GETTING SHOT SFX
    currentToneIdx = 0;
    millisStartedTone = currentMillis;
    tone(buzzerPin, hitMelody[currentToneIdx]);
    if (playingShootSound) {
      playingShootSound = false;
    }
    playingMelody = true;
  }
}
