const express = require("express");
const bodyParser = require("body-parser");
const elasticClient = require("./elastic-client");
const createIndex = require("./create-index");
const { indexName } = require("./constants");
require("express-async-errors");
const app = express();

app.use(bodyParser.json());

// createIndex(indexName);

app.get("/", (req, res) => {
  res.redirect("http://localhost:3000/");
});

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

app.get("/facetes-category", async (req, res) => {
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

const aggregation = (name) => {
  return {
    facets: {
      nested: {
        path: "string_facet",
      },
      aggs: {
        aggs_special: {
          filter: {
            match: {
              "string_facet.facet_name": name,
            },
          },
          aggs: {
            names: {
              terms: {
                field: "string_facet.facet_name",
              },
              aggs: {
                values: {
                  terms: {
                    field: "string_facet.facet_value",
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

const shouldFilterArray = (values) => {
  let array = [];
  values.forEach((value) => {
    array.push({
      term: {
        "string_facet.facet_value": value,
      },
    });
  });

  return array;
};

const flterQuery = (name, values) => {
  if (values.length > 1) {
    return {
      nested: {
        path: "string_facet",
        query: {
          bool: {
            filter: [
              {
                term: {
                  "string_facet.facet_name": name,
                },
              },
              {
                bool: {
                  should: shouldFilterArray(values),
                },
              },
            ],
          },
        },
      },
    };
  } else {
    return {
      nested: {
        path: "string_facet",
        query: {
          bool: {
            filter: [
              {
                term: {
                  "string_facet.facet_name": name,
                },
              },
              {
                term: {
                  "string_facet.facet_value": values[0],
                },
              },
            ],
          },
        },
      },
    };
  }
};

app.get("/facetes", async (req, res) => {
  const { category, filters } = req.query;

  const filtersObject = JSON.parse(filters);

  let filtersToApply = [];
  let filtersToApplyExceptColor = [];
  let filtersToApplyExceptSize = [];

  if (category) {
    filtersToApply.push(flterQuery("category", [category]));
    filtersToApplyExceptColor.push(flterQuery("category", [category]));
    filtersToApplyExceptSize.push(flterQuery("category", [category]));
  }

  if (Object.keys(filtersObject).length) {
    Object.entries(filtersObject).forEach(([facetName, filterValues]) => {
      filtersToApply.push(flterQuery(facetName, filterValues));
      if (facetName !== "color")
        filtersToApplyExceptColor.push(flterQuery(facetName, filterValues));
      if (facetName !== "size")
        filtersToApplyExceptSize.push(flterQuery(facetName, filterValues));
    });
  }

  const result = await elasticClient.search({
    index: indexName,
    aggs: {
      aggs_all_filters: {
        filter: {
          bool: {
            filter: filtersToApply,
          },
        },
        aggs: {
          facets: {
            nested: {
              path: "string_facet",
            },
            aggs: {
              names: {
                terms: {
                  field: "string_facet.facet_name",
                },
                aggs: {
                  values: {
                    terms: {
                      field: "string_facet.facet_value",
                    },
                  },
                },
              },
            },
          },
        },
      },

      aggs_color: {
        filter: {
          bool: {
            filter: filtersToApplyExceptColor,
          },
        },
        aggs: aggregation("color"),
      },

      aggs_size: {
        filter: {
          bool: {
            filter: filtersToApplyExceptSize,
          },
        },
        aggs: aggregation("size"),
      },
    },
    post_filter: {
      bool: {
        filter: filtersToApply,
      },
    },
  });
  res.send(result);
});

app.listen(8080, () => console.log("server started"));
