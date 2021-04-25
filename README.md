# IDG2001 course - Assignment 2
Project to IDG2001 class at NTNU. It should simulate MQTT messaging between publishers (smart sensors), broker and subscribers.

### Quick start

Get started in 3 quick steps

1. Install dependencies
  ```sh
  npm install
  ```
2. Enter your DB_URL in `.env`
  ```JS
  DB_URL = '<ENTER YOUR DB_URL>'
  // mongodb+srv://<user>:<password>@<cluster_hostname>/<DB_name>?retryWrites=true&w=majority
  ```
3. Start the broker
  ```sh
  npm start
  ```
4. Add a sensor (publisher)
  * Open a new terminal window

  ```sh
  node ./Class/publisher.js
  ```
5. Add a client (subscriber)
  * Open a new terminal window

  ```sh
  node ./Class/subscriber.js
  ```

### Event listeners of the Aedes Broker
* Event *'client'*:
  * When a client connects to the broker (*'connect'* event initiated by the client)
* Event *'subscribe'*:
  * When a client subscribes to one or more topics (*'subscribe'* event initiated by the client)
  * Stores the client in mongoDB to collection `Subscribers` with topics it had subscribed to (if it does not exist yet)
* Event *'publish'*:
  * When a client publishes a message to the broker (*'publish'* event initiated by the client)
  * Stores the publisher in mongoDB to collection `Publishers` (if it does not exist yet)
  * Stores the message in mongoDB to collection `Messages`
* Event *'unsubscribe'*:
  * When a client unsubscribes from one or more topics
* Event *'clientDisconnect'*:
  * When a client disconnects from the broker (closing the terminal window with pub/sub)
  * Deletes publisher/subscriber from `Publishers`/`Subscribers` collection respectively

### Publisher
Publishers have a choice of connecting to eiter one of the `rooms` below. Then the code chooses randomly which format of the message it will be sending from `messageTypes`:
```js
const rooms = ['Bedroom', 'Garage', 'LivingRoom', 'Basement'];
const messageTypes = ['application/senml+json', 'application/senml+xml'];
```
You can start one or more publishers. When starting a `publisher.js`:
1. Enter name of the publisher (sensor),
2. Enter a topic to which you want the sensor to connect,
3. Enter a unit reported by the sensor,
4. The publisher starts sending messages every 7.5 seconds to the broker in format:
  ```js
  { contentType: '<chosen messageType>',
    data: {
      bn: client.options.clientId,
      u: this.unit,
      n: this.name,
      v: getRandomIntInRange(-5,35),
      t: Date.now()
      }
  }
  ```

### Subscriber
Subsribers have a choice of connecting to any of the topics below. You can choose more than one topic. Then the code starts to listen to any of the messages published by a publisher.
```js
const rooms = ['Bedroom', 'Garage', 'LivingRoom', 'Basement'];
```
You can start one or more subscribers. When starting a `subscriber.js`:
1. Enter subscriber name,
2. Enter one or more topics,
3. The subscriber starts to listen to the broker and receives messages destined to the topics it subscribed to.
