var rooms = ['Bedroom', 'Garage', 'LivingRoom', 'Basement']

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// ---- Publisher ----
class Sensor {
  constructor(name, topic, unit) {
    this.name = name;
    this.topic = topic;
    this.unit = unit;
  }

  getSensorDetails() {
    return {
      "name": this.name,
      "topic": this.topic,
      "unit": this.unit
    }
  }

  // sendMessage() {
  //   let message = { v: this.unit, t: getRandomInt(30) }
  //
  //   client.on('connect', function (message) {
  //     console.log(`Published a message: \n${message}`);
  //     client.publish(this.topic, message);
  //     client.end()
  //     // setInterval( () => {
  //     //   const temp = getRandomInt(30);
  //     //   message.t = temp;
  //     //   const id = getRandomInt(3)
  //     //   topic = rooms[id];
  //     //   msg = JSON.stringify(message)
  //     //   client.publish(topic, msg);
  //     //   // console.log('message sent', topic, msg)
  //     // }, 7000)
  //   })
  // }
}

module.exports = Sensor;
