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
  async getallFacetes() {
    const response = await axios.get("/api/facetes");

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
    console.log(response);
    setSelection(
      response.hits.hits.map((hit) => {
        return hit._id;
      })
    );
  };

  useEffect(() => {
    api.getallProducts().then((response) => {
      let array = [];
      response.hits.hits.forEach((hit) => {
        let obj = {};
        obj.id = hit._id;
        obj.name = hit._source.name;
        hit._source.string_facet.forEach(({ facet_name, facet_value }) => {
          obj[facet_name] = facet_value;
        });
        array.push(obj);
      });

      setProducts(array);
    });
  }, []);

  useEffect(() => {
    api.getallFacetes().then((response) => {
      console.log(response.aggregations);
      // setFacetes(response.aggregations);
    });
  }, [products]);

  return (
    <>
      <Form addProduct={addProduct} />

      <Container sx={{ display: "flex" }}>
        {Object.keys(facetes).length && <FilterSidebar facetes={facetes} />}

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
