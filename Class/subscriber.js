// ----- IMPORTS -----
const mqtt = require('mqtt');
const prompt = require('prompt-sync')({ sigint: true });
const path = require('path');
var parser = require('xml2json');
const EXI4JSON = require('exificient.js');
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

// ---- SUBSCRIBER CLASS ----
class Subscriber {
  constructor(name, topics) {
    this.name = name;
    this.topics = topics;
  }

  getSubscriberDetails() {
    return {
      "name": this.name,
      "topics": this.topics
    }
  }

  connectToTopics() {
    client.on('connect', () => {
      client.subscribe(this.topics);
      logger.info(this.name, '- Subscribed to', this.topics.map(s => s).join(','), 'topic(s).')
    })
  }

  receiveMessages() {
    client.on('message', (topic, packet) => {
      console.log('packet:', packet);
      var payload = packet.toString();
      var exi = false;
      var data = null;
      if (!rooms.includes(topic))
        return logger.debug(this.name,'- Received a message on topic', topic)

      try {
        data = JSON.parse(JSON.stringify(EXI4JSON.parse(packet)))
        exi = true;
      } catch (e) {
        logger.info('Payload is not an EXI type.')
      }

      if (!exi) {
        data = JSON.parse(payload)
        // logger.debug('data:', data);
        let formattedData = null;
        if (data.contentType == 'application/senml+xml') {
          formattedData = parser.toJson(data.data);
          let dataParsed = JSON.parse(formattedData);
          data.data = dataParsed;
        }
      }
      data.topic = topic
      logger.info(this.name, '- Received a message from', data.data.n, 'on topic', topic, 'with data:', data)
    })
  }
}

// ----- SUBSCRIBER CORE CODE -----
// Event listener for errors on client
client.on('error', (err) => {
  logger.error(err);
})

let subCreation = {
  subTopics: [],
  subName: '',
  usersChoice: ''
}
while (subCreation.subTopics.length == 0 || !subCreation.subName.trim()) {
  if (!subCreation.subName.trim()) {
    console.log('Enter the subscriber\'s name:');
    subCreation.subName = prompt();
    if (!subCreation.subName.trim()) {
      logger.warn(`Incorrect name input. Please enter non-empty string.`);
      continue;
    }
  }

  // User chooses topics
  let includesAllTopics = false;
  while (!includesAllTopics || subCreation.usersChoice.trim() || subCreation.usersChoice.toLowerCase() === 'y') {
    let topic = ''
    if (!rooms.includes(topic)) {
      console.log('Enter the subscriber\'s topic. You can choose from these topics: ', rooms);
      topic = prompt();
      if (!rooms.includes(topic)) {
        logger.warn(subCreation.subName, '- Incorrect topic chosen. Please choose from these topics:', rooms);
        continue;
      }
      if (!subCreation.subTopics.includes(topic)) {
        subCreation.subTopics.push(topic);
        console.log('Currently assigned topics to subscriber:', subCreation.subTopics);
      }
      else {
        logger.warn(subCreation.subName, '- Topic is already chosen. Assigned topics:', subCreation.subTopics);
      }
    }

    subCreation.usersChoice = ''
    while (!subCreation.usersChoice.trim() || !(['n', 'y'].includes(subCreation.usersChoice.toLowerCase()))) {
      console.log('Continue adding topics to the subscriber? [Y/N]');
      subCreation.usersChoice = prompt()
      if (!subCreation.usersChoice.trim() || !(['n', 'y'].includes(subCreation.usersChoice.toLowerCase()))) {
        console.log('Wrong input.');
      }
    }
    if (subCreation.usersChoice.toLowerCase() === 'n')
      break;
    else if (subCreation.usersChoice.toLowerCase() === 'y') {
      includesAllTopics = subCreation.subTopics.length === rooms.length;
      if (includesAllTopics) {
        logger.info('All topics already assigned. Continuing with the creation.');
        break;
      }
      else continue;
    }
  }
}

let subscriber = new Subscriber(subCreation.subName, subCreation.subTopics);
logger.info(subscriber.name, '- Created a subscriber:', subscriber.getSubscriberDetails())
subscriber.connectToTopics();
subscriber.receiveMessages();
