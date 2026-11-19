/* ALL on-screen text and numbers live here. Numbers carry a source tag. */
window.FACTS = {
  nums: {
    sonarMs:   { v: 150, src: 'agro_aurd.ino' },
    slowCm:    { v: 50,  src: 'mac_relay.py config' },
    estopCm:   { v: 15,  src: 'mac_relay.py config' },
    clearCm:   { v: 25,  src: 'mac_relay.py config' },
    watchdogS: { v: 1,   src: 'mac_relay.py config' },
    arriveM:   { v: 2.0, src: 'mac_relay.py config' },
    loopHz:    { v: 10,  src: 'mac_relay.py' }
  },
  scenes: [
    { id: 'launch', head: 'LAUNCH', cap: 'No LiDAR. No Jetson. No RTK.', take: 'Low-cost by design',
      labels: ['Arduino', 'GPS'], rovy: 'Rovy online. Rolling out.',
      note: 'I wanted an autonomous farm rover that costs very little. This is the software behind the Agronym Solutions rover, 2nd place at InnovateX.' },
    { id: 'ears', head: 'THREE EARS', cap: 'Sonar read in turn.', take: 'Every 150 ms',
      labels: ['HC-SR04', 'UART / serial', 'baud'], rovy: 'Copy that. Obstacle ahead.',
      note: 'Three ultrasonic sensors, left, middle, right. The Arduino reads them in turn and sends one line over serial.' },
    { id: 'brain', head: 'BRAIN ON LAPTOP', cap: 'Phone is the radio.', take: 'Arduino, phone, laptop',
      labels: ['Tailscale', 'VPN', 'WebSocket'], rovy: 'Relaying. Laptop thinks.',
      note: 'The phone is the radio and sensor hub. The laptop is the brain. Click the link to cut it.' },
    { id: 'pid', head: 'STAY ON COURSE', cap: 'Tune it. Watch it wobble.', take: 'PID heading hold',
      labels: ['PID', 'Haversine', 'bearing'], rovy: 'Steering. Watch the wobble.',
      note: 'PID corrects heading error using present, accumulated and changing error. Turn the dials and see it.' },
    { id: 'safety', head: 'SAFETY BELOW AI', cap: 'Slow under 50. Stop under 15.', take: 'Clears at 25 cm',
      labels: ['hysteresis', 'watchdog', 'fail-safe'], rovy: 'Stopping. Hands off, AI.',
      note: 'Safety never depends on an LLM. Slide the crate in. Cut the sensor cable and the watchdog stops it.' },
    { id: 'bug', head: 'COPILOT BUG', cap: 'Planner saw defaults.', take: 'Key names did not match',
      labels: ['LLM tool calling', 'VLM'], rovy: 'Hmm. Defaults again, boss.',
      note: 'I found the planner was reading default values because the key names did not match. Then I fixed the keys.' },
    { id: 'reality', head: 'REALITY', cap: 'v2.0 I trust. v3.0 is an experiment.', take: 'Auto mode needs the loop',
      labels: ['MCP', 'Leaflet'], rovy: 'Honest log. Mission complete.',
      note: 'The deterministic v2.0 system is what I would trust on the field. In v3.0 the planner was not seeing real data.' }
  ],
  reality: {
    'REAL': ['Arduino firmware, three sonars', 'Geodesic navigation maths', 'v2.0 relay, PID, safety layer', 'Vision thread, LLM client', 'Leaflet cockpit', '18 navigation unit tests'],
    'PARTIAL': ['v3.0 planner read default values', 'v3.0 Auto mode does nothing', 'Heading undefined in place spin']
  },
  bug: {
    producer: ['gps.speed', 'heading.current', 'ultrasonic.l/m/r'],
    consumer: ['speed_mps', 'heading_deg', 'ultrasonic_cm.left/middle/right'],
    defaults: 'speed 0 · heading 0 · sonar 400'
  },
  terms: {
    'PID': ['Proportional-Integral-Derivative', 'Steers using present, accumulated and changing heading error.'],
    'Haversine': ['Haversine formula', 'Distance and bearing between two GPS points on a sphere.'],
    'HC-SR04': ['HC-SR04 sensor', 'Cheap ultrasonic distance sensor.'],
    'ultrasonic sonar': ['Ultrasonic sonar', 'Measures distance from the echo of a sound pulse.'],
    'H-bridge': ['H-bridge', 'Circuit that lets the Arduino spin motors both ways.'],
    'PWM': ['Pulse-width modulation', 'Controls motor power by switching it on and off fast.'],
    'baud': ['Baud rate', 'Serial speed. Here 9600 symbols per second.'],
    'UART / serial': ['UART serial link', 'Plain wire protocol between Arduino and phone.'],
    'Arduino': ['Arduino', 'Small microcontroller board that drives motors and reads sonars.'],
    'IMU': ['Inertial measurement unit', 'Motion sensor. Here the phone accelerometer.'],
    'GPS': ['Global Positioning System', 'Satellite position fix, read from the phone.'],
    'Tailscale': ['Tailscale', 'Private network linking phone and laptop anywhere.'],
    'VPN': ['Virtual private network', 'Encrypted tunnel between devices over the internet.'],
    'WebSocket': ['WebSocket', 'Two-way live connection from laptop to browser.'],
    'asyncio': ['Python asyncio', 'Lets one program do many waiting tasks at once.'],
    'Leaflet': ['Leaflet', 'Open map library used for the dark cockpit map.'],
    'hysteresis': ['Hysteresis', 'Stop at 15 cm, but only resume at 25 cm.'],
    'watchdog': ['Sensor watchdog', 'Stops the rover if sonar goes silent for 1 second.'],
    'fail-safe': ['Fail-safe', 'When something breaks, the rover stops.'],
    'VLM': ['Vision-language model', 'AI that reads a camera frame and gives guidance.'],
    'LLM tool calling': ['LLM tool calling', 'The language model picks named actions to run.'],
    'MCP': ['Model Context Protocol', 'Tool standard for AI models. Not wired in here.'],
    'bearing': ['Bearing', 'Compass direction from the rover to the next waypoint.']
  },
  keys: '← → move   P explore   R reality   T notes   M sound   F full',
  sim: 'SIMULATION · illustrative'
};
