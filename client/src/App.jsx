import {
  AppBar,
  Box,
  Container,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Toolbar,
} from "@mui/material";
import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Search, Delete } from "@mui/icons-material";
import axios from "axios";
import { faker } from "@faker-js/faker";
import { useEffect } from "react";
import Form from "./form";
import FilterSidebar from "./filterSidebar";

const api = {
  async addProduct(product) {
    const response = await axios.post("/api/product", product);

    return response.data;
  },
  async removeProduct(id) {
    const response = await axios.delete(`/api/product?id=${id}`);

    return response.data;
  },
  async search(query) {
    const response = await axios.get(`/api/search?query=${query}`);

    return response.data;
  },
  async getallProducts() {
    const response = await axios.get("/api/products");

    return response.data;
  },
  async getallFacetes(selectedCategory, filters) {
    const response = await axios.get(
      `/api/facetes?category=${selectedCategory}&filters=${JSON.stringify(
        filters
      )}`
    );

    return response.data;
  },
  async getallCategoryFacetes() {
    const response = await axios.get("/api/facetes-category");

    return response.data;
  },
};

const columns = [
  {
    field: "name",
    headerName: "name",
    flex: 2,
    minWidth: 150,
  },
  {
    field: "category",
    headerName: "category",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "color",
    headerName: "color",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "size",
    headerName: "size",
    flex: 1,
    minWidth: 150,
  },
];

const EditMenu = (props) => {
  return (
    <div>
      <Button
        startIcon={<Delete />}
        variant="contained"
        disabled={!props.selection.length}
        sx={{ my: 1, mr: 1 }}
        onClick={() => props.removeProducts(props.selection)}
      >
        Remove
      </Button>
    </div>
  );
};

const App = () => {
  const [products, setProducts] = useState([]);
  const [facetes, setFacetes] = useState({});
  const [selection, setSelection] = useState([]);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filters, setFilters] = useState({});
  const [updated, setUpdated] = useState(false);

  const addProduct = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const product = {
      name: data.get("name"),
      category: data.get("category"),
      color: data.get("color"),
      size: data.get("size"),
    };
    const response = await api.addProduct(product);
    setProducts([...products, { ...product, id: response._id }]);
  };

  const removeProducts = async (removedIds) => {
    setProducts(products.filter((product) => !removedIds.includes(product.id)));
    await Promise.all(removedIds.map((id) => api.removeProduct(id)));
  };

  const search = async () => {
    const response = await api.search(query);
    setSelection(
      response.hits.hits.map((hit) => {
        return hit._id;
      })
    );
  };

  const productToArrayOfObjects = (hits) => {
    let array = [];
    hits.forEach((hit) => {
      let obj = {};
      obj.id = hit._id;
      obj.name = hit._source.name;
      hit._source.string_facet.forEach(({ facet_name, facet_value }) => {
        obj[facet_name] = facet_value;
      });
      array.push(obj);
    });
    return array;
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    setFilters({});
  };

  const checkBoxChange = (e, filterName, key) => {
    setFilters((prevFilters) => {
      if (e.target.checked) {
        if (filterName in prevFilters) prevFilters[filterName].push(key);
        else prevFilters[filterName] = [key];
      } else {
        const facetValIndex = prevFilters[filterName].indexOf(key);
        prevFilters[filterName].splice(facetValIndex, 1);

        if (prevFilters[filterName].length === 0)
          delete prevFilters[filterName];
      }

      return prevFilters;
    });

    setUpdated((prev) => !prev);
  };

  useEffect(() => {
    api.getallProducts().then((response) => {
      let array = productToArrayOfObjects(response.hits.hits);

      setProducts(array);
    });
  }, []);

  useEffect(() => {
    api.getallCategoryFacetes().then((response) => {
      const categoryFacet = response.aggregations.facets.names.buckets.find(
        (facet) => facet.key === "category"
      );

      const newCategories = categoryFacet.values.buckets;
      setCategories(newCategories);
    });
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    api.getallFacetes(selectedCategory, filters).then((response) => {
      let array = productToArrayOfObjects(response.hits.hits);
      setProducts(array);

      const facets1 =
        response.aggregations.aggs_all_filters.facets.names.buckets;

      const sizeFacets =
        response.aggregations.aggs_size?.facets.aggs_special.names.buckets;

      const colorFacets =
        response.aggregations.aggs_color?.facets.aggs_special.names.buckets;

      let facets = [...facets1];

      if (colorFacets) {
        const colorFacetsValues = colorFacets[0].values.buckets;
        facets.forEach((facet) => {
          if (facet.key === "color") {
            facet.values.buckets = colorFacetsValues;
          }
        });
      }
      if (sizeFacets) {
        const sizeFacetsValues = sizeFacets[0].values.buckets;
        facets.forEach((facet) => {
          if (facet.key === "size") {
            facet.values.buckets = sizeFacetsValues;
          }
        });
      }

      let obj = {};
      facets.forEach((filter) => {
        if (filter.key in obj) {
          obj[filter.key] = [...obj[filter.key], ...filter.values.buckets];
        } else {
          obj[filter.key] = filter.values.buckets;
        }
      });
      setFacetes(obj);
    });
  }, [selectedCategory, updated]);

  return (
    <>
      <Form addProduct={addProduct} />

      <Container sx={{ display: "flex" }}>
        <FilterSidebar
          facetes={facetes}
          categories={categories}
          selectedCategory={selectedCategory}
          selectCategory={selectCategory}
          checkBoxChange={checkBoxChange}
          filters={filters}
        />

        <Container maxWidth="md">
          <TextField
            placeholder="Search"
            fullWidth
            value={query}
            onInput={(event) => setQuery(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment sx={{ pr: 1.5 }} position="start">
                  <IconButton onClick={search}>
                    <Search />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          ></TextField>
          <EditMenu selection={selection} removeProducts={removeProducts} />
          <div style={{ width: "100%" }}>
            <DataGrid
              autoHeight
              rows={products}
              columns={columns}
              pageSize={100}
              checkboxSelection
              onSelectionModelChange={(model) => setSelection(model)}
              selectionModel={selection}
            />
          </div>
        </Container>
      </Container>
    </>
  );
};

export default App;
