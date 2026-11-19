window.EXPLAIN = {
 "theme": {
  "bg": "#05100F",
  "ink": "#D6FFF2",
  "accent": "#2CFFB8",
  "line": "#1F8F6F",
  "font": "\"Trebuchet MS\",Verdana,sans-serif"
 },
 "title": "AXIOM",
 "line": "A payment safety layer for AI agents that pay for APIs on their own.",
 "achievements": [
  {
   "k": "3",
   "t": "3rd Place, HACK.ALGO 2026",
   "s": "Google Developer Groups, REVA University, National"
  },
  {
   "k": "5/6",
   "t": "Red-team attacks blocked",
   "s": "Simulated attacks on the SDK"
  }
 ],
 "stack": [
  "Python",
  "FastAPI",
  "Algorand",
  "Puya",
  "scikit-learn",
  "React"
 ],
 "sections": [
  {
   "h": "THE PROBLEM",
   "pts": [
    "Agents that pay for APIs can overspend, pay fake endpoints or be hijacked.",
    "Teams need to give agents spending power with limits that are enforced."
   ]
  },
  {
   "h": "WHAT I BUILT",
   "pts": [
    "A governance and audit layer on HTTP 402 (Payment Required), built with team CleverFyre.",
    "Six Algorand Testnet contracts: PolicyVault, IntentRegistry, SentinelEscrow, PaymentDNARegistry, ConsensusVault, ReputationLedger.",
    "An SDK for identity, intent, anomaly and semantic checks, plus a dashboard."
   ]
  },
  {
   "h": "HOW IT WORKS",
   "pts": [
    "The server answers 402; the agent starts the checks before paying.",
    "Identity: key derived from the agent's source code, so changed code means a new address.",
    "Intent: a JSON record of what, why and how much, sealed in a Merkle tree; only the 32-byte root goes on-chain.",
    "Dead Man's Switch: if the agent goes silent, its cap steps from normal to 1 ALGO, 0.1 ALGO, then frozen.",
    "Semantic router compares the API URL with approved categories, offline.",
    "Anomaly checks: burst limit plus an Isolation Forest.",
    "Escrow holds funds; optional M-of-N peer approval.",
    "An SLA oracle checks status, latency and valid JSON, then releases or refunds."
   ]
  },
  {
   "h": "EVIDENCE",
   "pts": [
    "Stress test: 4 of 4 scenarios passed.",
    "Red-team: 5 of 6 attacks blocked [report.json]",
    "55 saved intent documents.",
    "Six contracts deployed on Algorand Testnet."
   ]
  }
 ],
 "links": [
  {
   "label": "CODE",
   "url": "github.com/Falcon0516/CleverFyre"
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
