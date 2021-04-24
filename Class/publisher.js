// ----- IMPORTS -----
const mqtt = require('mqtt');
const prompt = require('prompt-sync')({sigint: true});
const path = require('path');
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
const messageTypes = ['application/senml+json', 'application/senml+xml'];

// ----- GLOBAL FUNCTIONS -----
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomIntInRange(min, max) {
  return Math.floor(min + Math.random() * max);
}

// ---- PUBLISHER CLASS ----
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

  connectSensor() {
    client.on('connect', () => {
      logger.info(this.name,`- sensor connected to ${this.topic} topic.`);
    })
  }

  sendMessage(messageType) {
    if (messageType == 'application/senml+json') {
      client.on('connect', () => {
        logger.info(this.name,`- sensor connected to ${this.topic} topic.`);
        setInterval(() => {
          let message = { contentType: 'application/senml+json',
            data: {
              u: this.unit,
              n: this.name,
              v: getRandomIntInRange(-5,35),
              t: Date.now()
              }
          }
          client.publish(this.topic, JSON.stringify(message));
          logger.info(this.name,'- Published a message:', message);
        }, 7500);
      })
    }
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
  sensorUnit: ''
}

while (!rooms.includes(sensorCreation.sensorTopic) || !sensorCreation.sensorName.trim() || !sensorCreation.sensorUnit.trim()) {
  if (!sensorCreation.sensorName.trim()) {
    console.log("Enter the sensor name:");
    sensorCreation.sensorName = prompt();
    if(!sensorCreation.sensorName.trim()) {
      logger.warn(`Incorrect name input. Please enter non-empty string.`);
      continue;
    }
  }

  if (!rooms.includes(sensorCreation.sensorTopic)) {
    console.log('Enter the sensor\'s topic. Choose from these topics: ', rooms);
    sensorCreation.sensorTopic = prompt();
    if (!rooms.includes(sensorCreation.sensorTopic)) {
      logger.warn(sensorCreation.sensorName,'- Incorrect topic chosen. Please choose from these topics:', rooms);
      continue;
    }
  }

  if (!sensorCreation.sensorUnit.trim()) {
    console.log(`Enter the sensor unit reported:`);
    sensorCreation.sensorUnit = prompt();
    if (!sensorCreation.sensorUnit.trim()) {
      logger.warn(sensorCreation.sensorName,`- Incorrect unit input. Please enter non-empty string.`);
      continue;
    }
  }
}

let sensor = new Sensor(sensorCreation.sensorName, sensorCreation.sensorTopic, sensorCreation.sensorUnit);
logger.info(sensor.name,`- Created a sensor: `, sensor.getSensorDetails());
sensor.sendMessage(messageTypes[0]);
// sensor.endConnection();
