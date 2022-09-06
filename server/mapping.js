const { indexName } = require("./constants");
const elasticClient = require("./elastic-client");

const addmappingToIndex = async function (idxName, mapping) {
  console.log(mapping);
  return await elasticClient.indices.putMapping({
    index: idxName,
    body: mapping,
  });
};

module.exports = addmappingToIndex;

// test function to explain how to invoke.
async function test() {
  //   const mapping = {
  //     properties: {
  //       name: {
  //         type: "keyword",
  //       },
  //       category: {
  //         type: "keyword",
  //       },
  //       color: {
  //         type: "keyword",
  //       },
  //       size: {
  //         type: "keyword",
  //       },
  //     },
  //   };

  const mapping = {
    properties: {
      string_facet: {
        type: "nested",
        properties: {
          facet_name: { type: "keyword" },
          facet_value: { type: "keyword" },
        },
      },
    },
  };

  try {
    const resp = await addmappingToIndex(indexName, mapping);
    console.log(resp);
  } catch (e) {
    console.log(e);
  }
}

test();
