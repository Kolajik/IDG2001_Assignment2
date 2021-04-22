const Publisher = require("./Class/publisher")


// Testing Publisher
var sensors = [];

sensors.push(new Publisher("Senzor1", "Topic1", "C"))
sensors.push(new Publisher("Senzor2", "Topic2", "V"))

sensors.forEach((item, i) => {
  console.log(item.getSensorDetails());
});
