import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import React from "react";

const FilterSidebar = ({
  facetes,
  categories,
  selectedCategory,
  selectCategory,
  checkBoxChange,
  filters,
}) => {
  console.log(facetes);
  return (
    <div>
      <h3>category</h3>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {categories.map(({ key, doc_count }, i) => (
          <Typography
            sx={{
              fontWeight: key === selectedCategory ? 600 : 400,
              cursor: "pointer",
            }}
            key={i}
            onClick={() => selectCategory(key)}
          >
            {key}
          </Typography>
        ))}
      </Box>

      {selectedCategory &&
        Object.entries(facetes).map(([filterName, data], index) => {
          if (filterName === "category") return;

          return (
            <div key={index}>
              <h3>{filterName}</h3>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {data.map(({ key, doc_count }, i) => (
                  <FormControlLabel
                    key={i}
                    control={
                      <Checkbox
                        checked={
                          filters[filterName]
                            ? filters[filterName].includes(key)
                              ? true
                              : false
                            : false
                        }
                        onChange={(e) => checkBoxChange(e, filterName, key)}
                      />
                    }
                    label={`${key} (${doc_count})`}
                  />
                ))}
              </Box>
            </div>
          );
        })}
    </div>
  );
};

export default FilterSidebar;
