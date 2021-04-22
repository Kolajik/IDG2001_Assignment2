var mosca = require('mosca');
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient

// ----- Broker -----
var settings = { port: parseInt(process.env.PORT) }
var broker = new mosca.Server(settings)


// Broker started
broker.on('ready', () => { console.log(`Broker ready on address ${process.env.BROKER}.`) })

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

    console.log("Connection to DB was successful.");

    // await listDatabases(mongodbClient);
  } finally {
    // await mongodbClient.close();
  }
}
runDB().catch(console.error);

// Broker stores to DB when data is published to it.
broker.on('published', (packet) => {
    const payload = packet.payload.toString()
    // console.log(payload)
    if (packet.topic !== 'Bedroom' && packet.topic !== 'LivingRoom' && packet.topic !== 'Garage') return console.log('info:', packet.topic)
    const data = JSON.parse(payload)
    data.topic = packet.topic

    const result = mongodbClient.db(DATABASE).collection(MSG_COLLECTION)
      .insertOne(data)
      .then(result => {
        console.log(`A new record with id ${result.insertedId} was inserted to DB ${DATABASE} and table ${MSG_COLLECTION}.`);
      })
})
