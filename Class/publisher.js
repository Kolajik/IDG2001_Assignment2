// ----- IMPORTS -----
const mqtt = require('mqtt');
const prompt = require('prompt-sync')({sigint: true});
const path = require('path');
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
const rooms = ['Bedroom', 'Garage', 'LivingRoom', 'Basement']
const sensorTypes = {
  type1: {

  },
}

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
      logger.info(`${this.name} sensor connected to ${this.topic} topic.`);
    })

    client.on('error', (err) => {
      logger.error(err);
    })
  }

  sendMessage() {
    client.on('connect', () => {
      logger.info(`${this.name} sensor connected to ${this.topic} topic.`);
      setInterval(() => {
        let message = {u: this.unit, n: this.name, t: getRandomIntInRange(-5,35)}
        client.publish(this.topic, JSON.stringify(message));
        logger.info(this.name,' - Published message: ', message);
      }, 5000);
    })

    client.on('error', (err) => {
      logger.error(err);
    })
  }

  endConnection() {
    client.end()

    client.on('error', (err) => {
      logger.error(err);
    })
  }
}

// ----- PUBLISHER CORE CODE -----
console.log("Enter the sensor name:");
let sensorName = prompt();
let sensorTopic = ''
while (!rooms.includes(sensorTopic)) {
  console.log(`Enter the sensor's topic. Choose from these topics: ${rooms.toString()}`);
  sensorTopic = prompt();
  if (!rooms.includes(sensorTopic)) {
    logger.warn(`Incorrect topic chosen. Please choose from these topics: ${rooms.toString()}`);
  }
}
console.log(`Enter the sensor unit reported:`);
const sensorUnit = prompt();

let sensor = new Sensor(sensorName, sensorTopic, sensorUnit);
logger.info(`Created a sensor: `, sensor.getSensorDetails());

sensor.sendMessage();
