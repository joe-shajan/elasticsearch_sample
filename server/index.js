const express = require("express");
const bodyParser = require("body-parser");
const elasticClient = require("./elastic-client");
const createIndex = require("./create-index");
const { indexName } = require("./constants");
require("express-async-errors");
console.log(indexName);
const app = express();

app.use(bodyParser.json());

// createIndex(indexName);

app.get("/", (req, res) => {
  res.redirect("http://localhost:3000/");
});

// app.post("/product", async (req, res) => {
//   const result = await elasticClient.index({
//     index: indexName,
//     document: {
//       name: req.body.name,
//       category: req.body.category,
//       color: req.body.color,
//       size: req.body.size,
//     },
//   });
//   res.send(result);
// });

app.post("/product", async (req, res) => {
  const { category, color, size } = req.body;
  const result = await elasticClient.index({
    index: indexName,
    document: {
      name: req.body.name,
      string_facet: [
        { facet_name: "category", facet_value: category },
        { facet_name: "color", facet_value: color },
        { facet_name: "size", facet_value: size },
      ],
    },
  });
  res.send(result);
});

app.delete("/product", async (req, res) => {
  const result = await elasticClient.delete({
    index: indexName,
    id: req.query.id,
  });

  res.json(result);
});

app.get("/search", async (req, res) => {
  const result = await elasticClient.search({
    index: indexName,
    query: { fuzzy: { name: req.query.query } },
  });
  res.json(result);
});

app.get("/products", async (req, res) => {
  const result = await elasticClient.search({
    index: indexName,
    query: { match_all: {} },
  });
  res.send(result);
});

// app.get("/facetes", async (req, res) => {
//   const result = await elasticClient.search({
//     index: indexName,
//     aggs: {
//       category_filter: {
//         terms: {
//           field: "category",
//         },
//       },
//       color_filter: {
//         terms: {
//           field: "color",
//         },
//       },
//       size_filter: {
//         terms: {
//           field: "size",
//         },
//       },
//     },
//   });
//   res.send(result);
// });

app.get("/facetes", async (req, res) => {
  const result = await elasticClient.search({
    index: indexName,
    aggs: {
      facets: {
        nested: {
          path: "string_facet",
        },
        aggs: {
          names: {
            terms: { field: "string_facet.facet_name" },
            aggs: {
              values: {
                terms: { field: "string_facet.facet_value" },
              },
            },
          },
        },
      },
    },
  });
  res.send(result);
});

// Express routes

app.listen(8080, () => console.log("server started"));
