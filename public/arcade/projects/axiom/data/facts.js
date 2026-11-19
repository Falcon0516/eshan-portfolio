// ALL on-screen text lives here. Source: 04_PROJECT_PROMPT truth sheet.
window.FACTS={
scenes:[
{h:"THE 402 DOOR",c:"Who checks that it should pay?",t:"Payment required",n:"An agent gets a 402. I ask who checks that it should pay.",gate:1,bot:0,ok:true,rd:"HTTP 402"},
{h:"WHO ARE YOU",c:"Change the code, change the address.",t:"Code-bound identity",n:"Change one character and the address changes. A tampered agent has no permissions.",gate:2,bot:2,ok:false,rd:"ED25519"},
{h:"SEAL IT",c:"32 bytes prove any intent.",t:"Merkle root",n:"Only 32 bytes go on-chain, but I can prove any single intent.",gate:3,bot:0,ok:true,rd:"MERKLE ROOT"},
{h:"DEAD MAN",c:"Go silent, lose your allowance.",t:"Normal, 1, 0.1, frozen",n:"If the agent stops checking in, its allowance shrinks until it is frozen.",gate:4,bot:3,ok:false,rd:"FROZEN"},
{h:"SENSE CHECK",c:"Meaning and outliers, locally.",t:"Semantic and anomaly guards",n:"The meaning check and the anomaly check both run locally.",gate:6,bot:1,ok:false,rd:"IsolationForest"},
{h:"HOLD THE MONEY",c:"Pay only for delivery.",t:"Escrow and SLA oracle",n:"The money moves only if the API actually delivers.",gate:8,bot:0,ok:true,rd:"RELEASE"},
{h:"RED TEAM",c:"Five of six blocked.",t:"Burst got through",n:"My own red team blocked five of six. The burst attack got through. The fix is 10 calls per 10 s.",gate:7,bot:4,ok:true,rd:"FIX 10 / 10 s"},
{h:"REALITY",c:"Deployed on Testnet, hackathon-grade.",t:"Hardening list known",n:"The SDK and contracts are real and deployed. On-chain enforcement is hackathon-grade and I know the hardening list.",gate:11,bot:0,ok:true,rd:"TESTNET"}],
gates:["402 challenge","Identity","Intent seal","Dead Man's Switch","Reputation","Semantic route","Anomaly check","Escrow","Consensus","Reasoning receipt","Settle and learn"],
attacks:[
{n:"Honest agent",b:0,at:0,r:"All 11 gates passed. SLA met, funds released."},
{n:"Tampered code",b:2,at:1,r:"Code hash changed, so the address changed."},
{n:"Budget trap",b:0,at:6,r:"Gradual escalation. Anomaly score -0.60."},
{n:"Domain spoof",b:2,at:5,r:"URL lands far from approved anchors."},
{n:"Semantic confusion",b:1,at:5,r:"Meaning does not match the category."},
{n:"Silent agent",b:3,at:3,r:"No proof of life. Tier 3, FROZEN."},
{n:"Replay old intent",b:1,at:2,r:"Intent already sealed in the Merkle root."},
{n:"Burst attack",b:4,at:7,r:"Nothing stopped the burst.",burst:true}],
ids:[["PolicyVault",758648168],["IntentRegistry",758648179],["SentinelEscrow",758648182],["PaymentDNARegistry",758648183],["ConsensusVault",758648184],["ReputationLedger",758648197]],
real:["Identity derivation","Intents and Merkle proofs","Semantic router","Anomaly detection","Behavioral DNA","HTTP 402 interception","SLA oracle","Six deployed contracts","Dashboard"],
partial:["Escrow deposit is a placeholder","Several methods lack caller checks","PolicyVault fails open on node errors","IPFS content IDs are stubs","Approve and Reject only log","Oracle skips reputation update"],
none:["Cross-contract calls","Payee other than deployer","Private reasoning receipts"],
terms:{"HTTP 402":"Payment Required: a web status asking the caller to pay first.","Ed25519":"A fast public-key signature scheme used for agent keys.","Merkle root":"One 32-byte hash that commits to many records.","Merkle":"A hash tree: any item is provable with few sibling hashes.","Dead Man's Switch":"Spending cap shrinks if the agent stops proving it is alive.","Escrow":"Funds held by a contract until delivery is confirmed.","escrow":"Funds held by a contract until delivery is confirmed.","SLA oracle":"A checker that confirms status, speed and valid JSON.","IsolationForest":"Outlier detector: odd points are isolated in few random splits.","Testnet":"Algorand practice network. No real money.","fails open":"On error, the check lets the request through.","Behavioral DNA":"A 32-byte fingerprint of how an agent spends.","SIMULATION":"Illustrative animation, not a measurement.","Semantic":"Compares meaning of a URL to approved categories.","Anomaly":"Flags bursts and odd amounts."},
src:"Truth Sheet, AXIOM audit"};
