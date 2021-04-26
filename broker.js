// ----- IMPORTS -----
const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
require('dotenv').config()
var parser = require('xml2json');
const MongoClient = require('mongodb').MongoClient
const path = require('path');
const EXI4JSON = require('exificient.js');
const Logger = require("beauty-logger");

// ----- DECLARATIONS OF GLOBAL VARS -----
const logger = new Logger({
  //max size of per log file, default: 10MB
  logFileSize: 1024 * 1024 * 5,
  logFilePath: {
    //log file name, default: as follows
    info: path.join(__dirname, "./info.log"),
    warn: path.join(__dirname, "./warn.log"),
    error: path.join(__dirname, "./error.log")
  },
  //enable data type warn, default: false
  dataTypeWarn: true,
  //disable print log in console, default: false
  productionModel: false,
  //only print log in console, default: false
  onlyPrintInConsole: false,
});
const rooms = ['Bedroom', 'Garage', 'LivingRoom', 'Basement']

// ----- BROKER -----
var port = parseInt(process.env.PORT)

server.listen(port, function () {
  logger.info('Aedes broker started and listening on port', port)
})

// Database definition and connection
const DATABASE = "Assignment2"
const MSG_COLLECTION = "Messages"
const PUB_COLLECTION = "Publishers"
const SUB_COLLECTION = "Subscribers"
const uri = process.env.DB_URL;
const mongodbClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function runDB() {
  try {
    await mongodbClient.connect();
    logger.info("BROKER - Connection to DB was successful.");
  } finally {
    // await mongodbClient.close();
  }
}
runDB().catch(console.error);

// When a sensor connects to the broker
aedes.on('client', function (client) {
  logger.info('BROKER - Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m', 'to broker', process.env.BROKER);
})

// When a sensor disconnects from the broker
aedes.on('clientDisconnect', async function (client) {
  logger.info('BROKER - Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
  var query = { clientID: client.id }

  // Deletes a publisher from PUB_COLLECTION
  const deletePub = await mongodbClient.db(DATABASE).collection(PUB_COLLECTION)
    .deleteOne(query)
    .catch(console.error);

  // Deletes a subscriber from SUB_COLLECTION
  const deleteSub = await mongodbClient.db(DATABASE).collection(SUB_COLLECTION)
    .deleteOne(query)
    .catch(console.error);

  if (deleteSub.deletedCount > 0 || deletePub.deletedCount > 0) {
    logger.info(`BROKER - Deleted ${client.id} from the database.`);
  }
})

// When a client subscribes to a topic
aedes.on('subscribe', async function (subscriptions, client) {
  // Find if subscriber exists. If not, insert into DB.
  var query = { clientID: client.id }
  const findSubscriber = await mongodbClient.db(DATABASE).collection(SUB_COLLECTION)
    .find(query)
    .toArray()
    .catch(console.error);

  if (findSubscriber.length == 0) {
    var sub_data = { clientID: client.id, topics: subscriptions.map(s => s.topic), insertedAt: Date.now() }
    const pushSubscriber = mongodbClient.db(DATABASE).collection(SUB_COLLECTION)
      .insertOne(sub_data)
      .then(pushSubscriber => {
        logger.info(`BROKER - A new subscriber with id ${sub_data.clientID} was inserted to DB ${DATABASE} and table ${SUB_COLLECTION}.`);
      })
      .catch(console.error)
  }

  logger.info('BROKER - MQTT client \x1b[32m' + (client ? client.id : client) +
    '\x1b[0m subscribed to topics: ' + subscriptions.map(s => s.topic).join(', '), 'from broker', process.env.BROKER)
})

// When a client unsubscribes from a topic
aedes.on('unsubscribe', function (subscriptions, client) {
  logger.info('MQTT client \x1b[32m' + (client ? client.id : client) +
    '\x1b[0m unsubscribed to topics: ' + subscriptions.join(', '), 'from broker', process.env.BROKER)
})

// Broker stores to DB when data is published to it.
aedes.on('publish', async function (packet, client) {
  var payload = packet.payload.toString()
  // payload with EXI is a big string not human readable
  // logger.info(`BROKER - Message received:`, payload)
  if (!rooms.includes(packet.topic))
    return logger.debug('BROKER - Client pushed a message to topic', packet.topic)

  var data = EXI4JSON.parse(packet.payload).wrap;
  console.log('\n\n Data recieved: \n', data)
  // console.log('client', client)
  console.log(packet)
  
  // if XML payload, parse to json object like this
  // var data = parser.toJson(payload, { object: true });
  // data = data.wrap

  // if json string payload, parse to json object like this
  // const data = JSON.parse(payload)

  data.topic = packet.topic
  let exi = true
  if (exi) {
    stringData = JSON.stringify(data)
    // console.log('stringit baby', stringData)
    data = JSON.parse(stringData)
    // Find if publisher exists. If not, insert into DB.
    var query = { name: data.n, topic: packet.topic }
    var pub_data = { name: data.n, topic: packet.topic, clientID: client.id, unit: data.u, insertedAt: Date.now() }
    const findSensor = await mongodbClient.db(DATABASE).collection(PUB_COLLECTION)
      .find(query)
      .toArray()
      .catch(console.error);

    if (findSensor.length == 0) {
      const pushSensor = mongodbClient.db(DATABASE).collection(PUB_COLLECTION)
        .insertOne(pub_data)
        .then(pushSensor => {
          logger.info(`BROKER - A new publisher with name ${pub_data.name} was inserted to DB ${DATABASE} and table ${PUB_COLLECTION}.`);
        })
        .catch(console.error)
    };

    // Store message in DB.
    const result = mongodbClient.db(DATABASE).collection(MSG_COLLECTION)
      .insertOne(data)
      .then(result => {
        logger.debug(`BROKER - Message`, data, `was inserted to DB ${DATABASE} and table ${MSG_COLLECTION}.`);
      })
  }
  else {
    // Find if publisher exists. If not, insert into DB.
    var query = { name: data.n, topic: packet.topic }
    var pub_data = { name: data.n, topic: packet.topic, clientID: client.id, unit: data.u, insertedAt: Date.now() }
    const findSensor = await mongodbClient.db(DATABASE).collection(PUB_COLLECTION)
      .find(query)
      .toArray()
      .catch(console.error);

    if (findSensor.length == 0) {
      const pushSensor = mongodbClient.db(DATABASE).collection(PUB_COLLECTION)
        .insertOne(pub_data)
        .then(pushSensor => {
          logger.info(`BROKER - A new publisher with name ${pub_data.name} was inserted to DB ${DATABASE} and table ${PUB_COLLECTION}.`);
        })
        .catch(console.error)
    };

    // Store message in DB.
    const result = mongodbClient.db(DATABASE).collection(MSG_COLLECTION)
      .insertOne(data)
      .then(result => {
        logger.debug(`BROKER - Message`, data, `was inserted to DB ${DATABASE} and table ${MSG_COLLECTION}.`);
      })
  }
})
