// ----- IMPORTS -----
const mqtt = require('mqtt');
const prompt = require('prompt-sync')({ sigint: true });
const path = require('path');
const EXI4JSON = require('exificient.js');
var parser = require('xml2json');
// const xml2json = require('xml2json'); // Used to convert JSON <--> XML
const Logger = require("beauty-logger");

// ----- DECLARATIONS OF GLOBAL VARS -----
const logger = new Logger({
  //max size of per log file, default: 10MB
  logFileSize: 1024 * 1024 * 5,
  logFilePath: {
    //log file name, default: as follows
    info: path.join(__dirname, "../info.log"),
    warn: path.join(__dirname, "../warn.log"),
    error: path.join(__dirname, "../error.log")
  },
  //enable data type warn, default: false
  dataTypeWarn: true,
  //disable print log in console, default: false
  productionModel: false,
  //only print log in console, default: false
  onlyPrintInConsole: false,
});
const client = mqtt.connect('mqtt://localhost:8080');
const rooms = ['Bedroom', 'Garage', 'LivingRoom', 'Basement'];
const messageTypes = ['senml+json', 'senml+xml', 'senml+exi'];

// ----- GLOBAL FUNCTIONS -----
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomIntInRange(min, max) {
  return Math.floor(min + Math.random() * max);
}

// ---- PUBLISHER CLASS ----
class Sensor {
  constructor(name, topic, unit, payload) {
    this.name = name;
    this.topic = topic;
    this.unit = unit;
    this.payload = payload;
  }

  getSensorDetails() {
    return {
      "name": this.name,
      "topic": this.topic,
      "unit": this.unit,
      'payload': this.payload
    }
  }

  connectSensor() {
    client.on('connect', () => {
      logger.info(this.name, `- sensor connected to ${this.topic} topic.`);
    })
  }

  sendMessage() {
    client.on('connect', () => {
      logger.info(this.name, `- sensor connected to ${this.topic} topic, with ${this.payload} as payload`);
      setInterval(() => {
        let message = {
          wrap: {
            contentType: `application/${this.payload}`,
            data: {
              bn: client.options.clientId,
              u: this.unit,
              n: this.name,
              v: getRandomIntInRange(-5, 35),
              t: Date.now()
            }
          }
        }
        let options = { properties: { contentType: this.payload } }

        if (this.payload == 'senml+json') {
          var jsonMSG = JSON.stringify(message)
          client.publish(this.topic, jsonMSG);
        }
        if (this.payload == 'senml+xml') {
          // encode JSON object
          var xmlMSG = parser.toXml(message);
          client.publish(this.topic, xmlMSG);
        }
        if (this.payload == 'senml+exi') {

          // encode JSON object
          var uint8Array = EXI4JSON.exify(message);
          client.publish(this.topic, uint8Array, options);
        }
        logger.info(this.name, '- Published a message as ', this.payload, message);
      }, 7500);
    })
  }

  endConnection() {
    client.end()
  }
}

// ----- PUBLISHER CORE CODE -----
// Event listener for errors on client
client.on('error', (err) => {
  logger.error(err);
})

let sensorCreation = {
  sensorTopic: '',
  sensorName: '',
  sensorUnit: '',
  sensorPayload: ''
}

while (!rooms.includes(sensorCreation.sensorTopic) || !sensorCreation.sensorName.trim() || !sensorCreation.sensorUnit.trim() || !sensorCreation.sensorPayload.trim()) {
  if (!sensorCreation.sensorName.trim()) {
    console.log("Enter the sensor name:");
    sensorCreation.sensorName = prompt();
    if (!sensorCreation.sensorName.trim()) {
      logger.warn(`Incorrect name input. Please enter non-empty string.`);
      continue;
    }
  }

  if (!rooms.includes(sensorCreation.sensorTopic)) {
    console.log('Enter the sensor\'s topic. Choose from these topics: ', rooms);
    sensorCreation.sensorTopic = prompt();
    if (!rooms.includes(sensorCreation.sensorTopic)) {
      logger.warn(sensorCreation.sensorName, '- Incorrect topic chosen. Please choose from these topics:', rooms);
      continue;
    }
  }

  if (!messageTypes.includes(sensorCreation.sensorPayload)) {
    console.log('Enter the sensor\'s payload type. Choose from these types: ', messageTypes);
    sensorCreation.sensorPayload = prompt();
    if (!messageTypes.includes(sensorCreation.sensorPayload)) {
      logger.warn(sensorCreation.sensorName, '- Incorrect payload chosen. Please choose from these topics:', messageTypes);
      continue;
    }
  }

  if (!sensorCreation.sensorUnit.trim()) {
    console.log(`Enter the sensor unit reported:`);
    sensorCreation.sensorUnit = prompt();
    if (!sensorCreation.sensorUnit.trim()) {
      logger.warn(sensorCreation.sensorName, `- Incorrect unit input. Please enter non-empty string.`);
      continue;
    }
  }

}

let sensor = new Sensor(sensorCreation.sensorName, sensorCreation.sensorTopic, sensorCreation.sensorUnit, sensorCreation.sensorPayload);
logger.info(`- Created a sensor: \n`, sensor.getSensorDetails());
sensor.sendMessage();
// sensor.endConnection();
