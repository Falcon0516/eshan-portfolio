/* ALL on-screen text, numbers, notes and tooltips live here. Edit freely. */
(function () {
  var U = window.UTB = window.UTB || {};
  U.FACTS = {
    slug: 'usb-tcp-bridge',
    title: 'USB-TCP BRIDGE',
    author: 'Eshan H',
    nums: {
      queueCap: { v: 1000, src: 'DataBridge' },
      readBuf: { v: 4096, unit: 'B', src: 'USBManager' },
      fallbackBaud: { v: 9600, src: 'build log' }
    },
    ports: [
      { key: 'main', n: 1234, name: 'MAIN BRIDGE', line: 'Serial both ways. Everything except US: lines.', src: 'BridgeService' },
      { key: 'tele', n: 8001, name: 'TELEMETRY', line: 'Phone accelerometer and gyroscope, fastest rate.', src: 'TelemetryManager' },
      { key: 'gps', n: 8002, name: 'GPS', line: 'Phone location, once a second.', src: 'GPSManager' },
      { key: 'us', n: 8004, name: 'ULTRASONIC', line: 'US:L,M,R lines split off the serial stream.', src: 'USBManager' }
    ],
    portsFoot: 'The Pro-Rover config also names port 8000 for motors.',
    samples: {
      us: 'US:12,40,33', hello: 'HELLO', accel: 'ACCEL:0.1,0.0,9.8',
      gps: 'GPS:12.97,77.59,900,0', m: 'M:100,100', stop: 'M:0,0',
      loop: ['US:12,40,33', 'HELLO', 'US:11,42,31', 'HELLO', 'US:13,39,34']
    },
    scenes: [
      { head: 'A WIRE', cap: 'A phone turns serial into Wi-Fi.', take: 'Robot to four ports',
        plug: 'I am the cable. Plug me in.',
        notes: 'I wanted a phone to be the wireless hub for my robot. USB goes in, Wi-Fi comes out. One cable, four ports.' },
      { head: 'SORT BYTES', cap: 'Newline ends a message.', take: 'US: goes to 8004',
        plug: 'Newline means \u201cmessage ends here\u201d.',
        notes: 'Serial and TCP are both byte streams with no message boundaries. So I use newline terminated lines with prefixes. The router reads the prefix and picks a port.' },
      { head: 'NEVER BLOCK', cap: 'Drop the oldest, keep latency low.', take: '1000 slots',
        plug: 'Full? I drop the oldest.',
        notes: 'Queues decouple slow Wi-Fi from fast serial. When a queue fills, I drop the oldest line. Fresh data matters more than old data.' },
      { head: 'STAY AWAKE', cap: 'Wake locks. Fail-safe stop.', take: 'Disconnect means stop',
        plug: 'Screen off? Locks keep me alive.',
        notes: 'A foreground service plus wake locks keeps the bridge alive with the screen off. If the control client disconnects, the app writes M:0,0 to the motors. A dropped connection means stop.' },
      { head: 'REALITY', cap: 'Bugs found, lessons kept.', take: 'Baud and one client',
        plug: 'Bugs are lessons.',
        notes: 'These are the bugs I found reading my own code. The baud rate resets and each port takes one client.' }
    ],
    reality: {
      real: ['Foreground service with wake locks', 'Four TCP servers', 'Queue forwarding, oldest dropped when full',
        'US: lines split to port 8004', 'Fail-safe stop: M:0,0', 'Auto-start on USB attach'],
      partial: ['Baud falls back to 9600 after permission', 'UI shows 1235/1236, service uses 8001/8002',
        'Every log line appears twice', 'One client per port, new replaces old',
        'Text only, binary breaks framing', 'Build fails on JDK 25, use 17 or 21']
    },
    labs: [
      { id: 'pipes', name: 'PIPES', cap: 'Send a line. Watch the router pick a port.' },
      { id: 'framing', name: 'FRAMING', cap: 'Bytes have no edges. Newline makes them.' },
      { id: 'queue', name: 'QUEUE', cap: 'Slow Wi-Fi fills the queue. Oldest drops.' },
      { id: 'power', name: 'POWER', cap: 'Screen off. Locks on or off.' },
      { id: 'failsafe', name: 'FAIL-SAFE', cap: 'Cut the client. Watch the motor stop.' },
      { id: 'baud', name: 'BAUD', cap: 'Both ends must agree on speed.' },
      { id: 'ports', name: 'PORTS', cap: 'Click a port. See what flows there.' }
    ],
    terms: {
      'USB-OTG': 'USB On-The-Go. The phone acts as host for the robot board.',
      'SERIAL': 'UART serial: a wire that sends bytes one after another.',
      'BAUD': 'Serial speed in bits per second. Both ends must agree.',
      'TCP': 'Transmission Control Protocol. A reliable byte stream over Wi-Fi.',
      'PORT': 'A numbered door on the phone where one stream is served.',
      'PORTS': 'A numbered door on the phone where one stream is served.',
      'FRAMING': 'Marking where one message ends. Here, a newline byte.',
      'ROUTER': 'Demultiplexer: sends each line to the right port by its prefix.',
      'FOREGROUND SERVICE': 'Android service with a notification, so the system keeps it alive.',
      'WAKELOCK': 'Keeps the phone CPU running while the screen is off.',
      'WAKE LOCKS': 'Keeps CPU and Wi-Fi running while the screen is off.',
      'WIFILOCK': 'Keeps Wi-Fi at full speed while the screen is off.',
      'QUEUE': 'ArrayBlockingQueue: a bounded buffer. When full, the oldest drops.',
      'BACKPRESSURE': 'A slow receiver pushing back on a fast sender.',
      'FAIL-SAFE': 'Safe default on failure. Here, motors stop with M:0,0.',
      'IMU': 'Inertial Measurement Unit: accelerometer plus gyroscope.',
      'GPS': 'Global Positioning System: location from satellites, once a second.',
      'NODELAY': 'TCP_NODELAY turns off Nagle\u2019s algorithm. Small packets leave at once.',
      'KOTLIN': 'The programming language this Android app is written in.',
      'ARDUINO': 'Small microcontroller board that reads sensors and drives motors.',
      'WI-FI': 'Wireless network link between the phone and the laptop.',
      'USB_DEVICE_ATTACHED': 'Android broadcast sent when a USB device is plugged in.',
      'USB-SERIAL CHIPS': 'FTDI, CP210x, CH34x: common chips that turn USB into serial.'
    },
    termOrder: ['FOREGROUND SERVICE', 'WAKE LOCKS', 'FAIL-SAFE', 'BACKPRESSURE', 'USB-OTG', 'FRAMING', 'SERIAL', 'WI-FI', 'PORTS', 'QUEUE', 'ROUTER', 'BAUD', 'TCP', 'GPS', 'IMU'],
    hint: '\u2190 \u2192 scenes   P explore   R reality   T notes   M sound   F full',
    badge: 'SIMULATION \u00b7 illustrative'
  };
})();
