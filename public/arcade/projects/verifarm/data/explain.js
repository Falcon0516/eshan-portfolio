window.EXPLAIN = {
 "theme": {
  "bg": "#3A2518",
  "ink": "#FFF1D6",
  "accent": "#FF9933",
  "line": "#B8742E",
  "font": "Georgia,\"Times New Roman\",serif"
 },
 "title": "VERIFARM",
 "line": "Farm-to-fork traceability on a shared blockchain, so farmers keep fair value.",
 "achievements": [
  {
   "k": "1",
   "t": "1st Place, ADVAYA Hackathon 2.0",
   "s": "BGSCET, National"
  }
 ],
 "stack": [
  "Hyperledger Fabric",
  "Go",
  "Express",
  "FastAPI",
  "React Native",
  "PostgreSQL",
  "scikit-learn"
 ],
 "sections": [
  {
   "h": "THE PROBLEM",
   "pts": [
    "Farmers lose fair value because buyers cannot verify where produce came from.",
    "Middlemen can exploit the mandi system."
   ]
  },
  {
   "h": "WHAT I BUILT",
   "pts": [
    "A shared record that follows produce from farm to consumer across six organisations: government, mandi, farmer co-op, transporter, processor, retailer.",
    "Six Go chaincodes, an Isolation Forest fraud detector and an 8-role mobile app in Kannada, Hindi and English.",
    "Consumers can trace packaged food by QR code."
   ]
  },
  {
   "h": "HOW IT WORKS",
   "pts": [
    "A farmer gets an ID; Aadhaar and mobile are stored only as SHA-256 hashes.",
    "Each harvest becomes a token with quantity and season.",
    "Mandi sales below the minimum support price are blocked or flagged.",
    "Transport is checked with Haversine distance; a deviation above 50 km is flagged.",
    "Processing yield must fall in a realistic range, such as 82 to 88% for ragi.",
    "A trust score rises with good deliveries and falls with violations.",
    "Detectors run every 30 minutes and 6 hours and push alerts to government users.",
    "Notifications try voice, then WhatsApp, then SMS."
   ]
  },
  {
   "h": "STACK",
   "pts": [
    "Fabric with Raft ordering and CouchDB.",
    "Node.js, Express, GraphQL, Socket.IO, PostgreSQL with 13 tables.",
    "Turborepo monorepo with Docker."
   ]
  }
 ],
 "links": [
  {
   "label": "CODE",
   "url": "github.com/Falcon0516/VERIFARM_BLOCKCHAIN_AND_AI_FOR_SUPPLYCHAIN_MANAGEMENT_AGRICULTURE"
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
