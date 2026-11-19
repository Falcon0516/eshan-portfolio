window.EXPLAIN = {
 "theme": {
  "left": "28%",
  "bg": "#2A1A12",
  "ink": "#F2E3C6",
  "accent": "#E0642A",
  "line": "#8A5A3A",
  "font": "\"Arial Narrow\",Impact,Arial,sans-serif"
 },
 "title": "PRO-ROVER",
 "line": "The software for a low-cost autonomous farm rover: no LiDAR, no Jetson, no RTK.",
 "achievements": [
  {
   "k": "2",
   "t": "2nd Place, InnovateX",
   "s": "SJBIT, 70+ teams"
  }
 ],
 "stack": [
  "Arduino C++",
  "Python",
  "Kotlin",
  "Groq",
  "Leaflet",
  "Tailscale"
 ],
 "sections": [
  {
   "h": "THE PROBLEM",
   "pts": [
    "Field robotics is out of reach for small farms and student labs.",
    "Most rovers need costly sensors and computers."
   ]
  },
  {
   "h": "WHAT I BUILT",
   "pts": [
    "An Arduino drives two motors and reads three ultrasonic sensors.",
    "An ordinary Android phone is the radio, GPS and accelerometer hub.",
    "A laptop does the thinking and shows a Leaflet map cockpit."
   ]
  },
  {
   "h": "HOW IT WORKS",
   "pts": [
    "The Arduino reads left, middle and right sonar in turn; a full reading every 150 ms.",
    "The phone relays serial data over Wi-Fi through the USB-TCP Bridge, linked by Tailscale.",
    "A 10 Hz loop computes bearing and distance to the next GPS waypoint.",
    "A PID controller holds the heading on a straight line.",
    "Safety layer: slow below 50 cm, stop below 15 cm, clears at 25 cm.",
    "A 1 second sensor watchdog stops the rover if data goes quiet.",
    "v3.0 adds an LLM tool-calling loop and a vision thread as an agentic experiment."
   ]
  },
  {
   "h": "BUILT AND TESTED",
   "pts": [
    "18 unit tests for navigation maths: geodesic distance, arrival, heading, noise rejection.",
    "v2.0 is the deterministic system I would trust in the field."
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
