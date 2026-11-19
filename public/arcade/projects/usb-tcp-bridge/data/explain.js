window.EXPLAIN = {
 "theme": {
  "bg": "#0B3A6B",
  "ink": "#EAF6FF",
  "accent": "#7FD0FF",
  "line": "#7FD0FF",
  "font": "\"Courier New\",Courier,monospace"
 },
 "title": "USB-TCP BRIDGE",
 "line": "An Android app that turns a phone into a wireless hub for a robot controller.",
 "achievements": [
  {
   "k": "2",
   "t": "2nd Place, InnovateX",
   "s": "SJBIT, 70+ teams, with the Agronym Rover"
  }
 ],
 "stack": [
  "Kotlin",
  "Arduino C++",
  "Python",
  "USB-OTG",
  "TCP",
  "Groq"
 ],
 "sections": [
  {
   "h": "THE PROBLEM",
   "pts": [
    "Robot controllers need a wire, a laptop or an expensive radio.",
    "Small farms and student labs need something affordable."
   ]
  },
  {
   "h": "WHAT I BUILT",
   "pts": [
    "A native Kotlin app: plug a phone into an Arduino or ESP32 over USB-OTG and it becomes a Wi-Fi bridge.",
    "It forwards bytes both ways between the serial port and a TCP port.",
    "It streams the phone's accelerometer, gyroscope and GPS on their own ports."
   ]
  },
  {
   "h": "HOW IT WORKS",
   "pts": [
    "Plugging in a supported USB-serial chip launches the service, even with the UI closed.",
    "A foreground service holds a CPU wake lock and a Wi-Fi lock to keep running with the screen off.",
    "Four TCP servers: bridge (1234), telemetry (8001), GPS (8002), ultrasonic (8004).",
    "Bytes are split on newlines; lines starting US: go to the ultrasonic port, the rest to the bridge.",
    "Two bounded queues of 1000 items drop the oldest data so latency stays low.",
    "Fail-safe: if the control connection drops, the app sends M:0,0 and the motors stop."
   ]
  },
  {
   "h": "FIT",
   "pts": [
    "It is the phone half of the Pro-Rover.",
    "Auto-start on USB attach for FTDI, CP210x, PL2303, CH34x, Arduino, Teensy and more."
   ]
  }
 ],
 "links": [
  {
   "label": "CODE",
   "url": "github.com/Falcon0516/ANDROID_USB_TCP_BRIDGE_APPLICATION"
  },
  {
   "label": "PORTFOLIO",
   "url": "eshan-portfolio.streyeke.cloud"
  },
  {
   "label": "GITHUB",
   "url": "github.com/Falcon0516"
  },
  {
   "label": "LINKEDIN",
   "url": "linkedin.com/in/eshan-h"
  }
 ]
};
