/* All on-screen text and numbers. Source tags: truth sheet unless marked sim. */
window.FACTS = {
  vad: { threshold: 0.015, silenceMs: 800, minSpeechMs: 300, src: 'VAD config, V2 code' },
  v1: { ms: 300, tag: 'author-reported' },
  scenes: [
    { id:'ring',  h:'RING RING',    cap:'Answer the call.', take:'A call, no internet needed', note:"Many people only have a voice call. I built SAATHI to answer it in their language.", bubble:'A health worker is calling' },
    { id:'hear',  h:'HEAR',         cap:'Silence for 800 ms ends the sentence.', take:'VAD finds the end of speech', note:"VAD means voice activity detection. It waits for 800 ms of quiet, then the sentence is done.", bubble:'Turn the brass knobs' },
    { id:'write', h:'WRITE',        cap:'Voice becomes words, online or offline.', take:'Speech to text', note:"Online uses Sarvam for Indian languages. Offline uses Whisper on the same machine.", bubble:'Flip ONLINE or OFFLINE' },
    { id:'early', h:'SPEAK EARLY',  cap:'First sentence plays before the reply ends.', take:'Chunked streaming', note:"I do not wait for the full reply. I speak each sentence as soon as it is complete.", bubble:'Hear the first sentence' },
    { id:'mute',  h:'MUTE THE MIC', cap:'While it talks, it does not listen.', take:'Echo suppression', note:"While the AI talks, the mic is muted so it does not answer itself.", bubble:'Lift the red latch' },
    { id:'two',   h:'TWO LIVES',    cap:'V1 Python. V2 Rust.', take:'Prototype to system', note:"V1 proved it works. V2 made it a proper system.", bubble:'Flip the board' },
    { id:'real',  h:'REALITY',      cap:'Bluetooth audio is still a stub.', take:'Honest status', note:"The Bluetooth audio bridge is the unsolved part. I have a fallback design.", bubble:'This part is honest' }
  ],
  stations: ['EAR','LISTEN','THINK','SPEAK','LINE'],
  tape: {
    EN: { on:'I have had a fever for two days.', off:'I have had a fever for two days.' },
    HI: { on:'मुझे दो दिन से बुखार है।', off:'मुझे दो दिन से बुखार है' },
    KN: { on:'ನನಗೆ ಎರಡು ದಿನದಿಂದ ಜ್ವರ ಇದೆ.', off:'ನನಗೆ ಎರಡು ದಿನದಿಂದ ಜ್ವರ ಇದೆ' }
  },
  engine: { on:'Sarvam saaras:v3', off:'whisper-rs', llmOn:'Groq Llama 3.3 70B', llmOff:'Ollama Llama 3.2 3B', ttsOn:'Sarvam bulbul:v3', ttsOff:'Piper' },
  reply: ['Drink clean water.', 'Rest today.', 'Visit a clinic if the fever stays.'],
  versions: {
    v1: { t:'VERSION 1', s:'Python', l:['ADB + Scrcpy','Groq, local Whisper, Piper'], n:'~300 ms, author-reported' },
    v2: { t:'VERSION 2', s:'Rust + Tauri', l:['VoidRelay desktop','Android + iOS companions','Offline mode'], n:'' }
  },
  reality: {
    'REAL':['WebSocket server and heartbeat','Call state machine','VAD and echo mute','Sarvam, Groq, Ollama, Whisper clients','SQLite call history','Telegram commands'],
    'PARTIAL':['Bluetooth audio: designed, stubbed','iOS audio fallback: not compiled','Language detection returns Mixed']
  },
  tips: {
    'VAD':'Voice Activity Detection: finds when someone is speaking.', 'RMS':'Root Mean Square: average loudness of a sound.',
    'STT':'Speech To Text: turns voice into written words.', 'TTS':'Text To Speech: turns written words into voice.',
    'LLM':'Large Language Model: the AI that writes the reply.', 'SSE':'Server-Sent Events: a stream of small updates.',
    'WebSocket':'A live two-way connection between phone and PC.', 'HFP':'Hands-Free Profile: Bluetooth calling audio.',
    'ADB':'Android Debug Bridge: controls an Android phone from a PC.', 'Scrcpy':'Screen Copy: mirrors an Android screen.',
    'Whisper':'Open speech recognition model that runs offline.', 'Piper':'Small offline text to speech engine.',
    'Ollama':'Runs language models on your own machine.', 'Groq':'Hosted service that runs the online language model.',
    'Sarvam':'Indian speech service for Hindi and Kannada.', 'echo suppression':'Muting the mic while the speaker plays.',
    'SQLite':'A small database stored in one file.', 'Tauri':'Toolkit for desktop apps with a Rust core.',
    'Rust':'A fast systems programming language.', 'cpal':'Rust library that captures audio.',
    'ring buffer':'A fixed loop of memory for audio.', 'lock-free':'Threads share data without waiting on locks.'
  }
};
