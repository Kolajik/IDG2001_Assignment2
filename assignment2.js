// ----- Module imports -----
var mqtt = require('mqtt');
var client = mqtt.connect(process.env.BROKER);

const Publisher = require("./Class/publisher");

// ----- FUNC declarations -----
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// ----- Core of the Assignment2 -----
var sensors = [];

sensors.push(new Publisher("Senzor1", "Topic1", "C"))
let message = { v: this.unit, t: getRandomInt(30) }

sensors.forEach((item, i) => {
  console.log(item.getSensorDetails());
  client.on('connect', function (item, message) {
    client.subscribe(item.getSensorDetails().topic, function (item, message, err) {
      if (!err) {
        console.log(`Published a message: \n${message}`);
        client.publish(item.getSensorDetails().topic, message);
      }
    })

    // setInterval( () => {
    //   const temp = getRandomInt(30);
    //   message.t = temp;
    //   const id = getRandomInt(3)
    //   topic = rooms[id];
    //   msg = JSON.stringify(message)
    //   client.publish(topic, msg);
    //   // console.log('message sent', topic, msg)
    // }, 7000)
  })
});
