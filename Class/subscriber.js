var mqtt = require('mqtt');
var client = mqtt.connect(process.env.BROKER)

// ---- Subscribers ----
client.on('message', (topic, packet) => {
    const msg = packet.toString()
    console.log('\ntopic:', topic, '\ndata:', msg, '\nsaved to DB')
    // could save to DB here in different collections -> topic
})
client.on('connect', () => {
    client.subscribe('Garage')
    client.subscribe('Bedroom')
    client.subscribe('LivingRoom')
})
