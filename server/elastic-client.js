const { Client } = require("@elastic/elasticsearch");

require("dotenv").config({ path: ".elastic.env" });

const elasticClient = new Client({
  cloud: {
    id: process.env.ELASTIC_CLOUD_ID,
  },
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD,
  },
});
//also can use api key insted of username and password
//to generete api key we need to run a function from elasticsearch and pass the settigs options

elasticClient
  .ping()
  .then((response) => console.log(" You are connected to Elasticsearch ! "))
  .catch((error) => console.error(" Elasticsearch is not connected . "));

module.exports = elasticClient;
