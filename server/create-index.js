const elasticClient = require("./elastic-client");

const createIndex = async (indexName) => {
  return await elasticClient.indices.create({ index: indexName });
};

module.exports = createIndex;
