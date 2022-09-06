import { Box, Checkbox, FormControlLabel } from "@mui/material";
import React from "react";

const FilterSidebar = ({ facetes }) => {
  return (
    <div>
      <h3>category_filter</h3>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {facetes.category_filter &&
          facetes.category_filter.buckets.map(({ key, doc_count }, i) => (
            <FormControlLabel
              key={i}
              control={<Checkbox />}
              label={`${key} (${doc_count})`}
            />
          ))}
      </Box>

      {Object.entries(facetes).map(([filterName, data], index) => (
        <>
          {filterName !== "category_filter" && (
            <>
              <h3 key={index}>{filterName}</h3>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {data.buckets.map(({ key, doc_count }, i) => (
                  <FormControlLabel
                    key={i}
                    control={<Checkbox />}
                    label={`${key} (${doc_count})`}
                  />
                ))}
              </Box>
            </>
          )}
        </>
      ))}
    </div>
  );
};

export default FilterSidebar;
