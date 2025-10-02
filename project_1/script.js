window.onload = function () {
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", 300)
    .attr("height", 200);

  d3.csv("./data/named_colors_css.csv")
    .then((data) => {
      console.log("CSV data loaded:", data); // See the full data structure
      console.log("Number of colors:", data.length); // Check how many colors we have

      data.forEach((d, index) => {
        console.log(`${index}: ${d.Name} - ${d.Hex}`); // Show index, name, and hex
      });

      // Make sure we have enough data before accessing index 4
      if (data.length > 4) {
        svg
          .append("circle")
          .attr("cx", 150)
          .attr("cy", 100)
          .attr("r", 50)
          .style("fill", data[4].Hex); // Use the 5th color's hex value

        console.log("Circle created with color:", data[4].Name, data[4].Hex);
      } else {
        console.log("Not enough data - using first color instead");
        svg
          .append("circle")
          .attr("cx", 150)
          .attr("cy", 100)
          .attr("r", 50)
          .style("fill", "blue"); // 's hex value
      }
    })
    .catch((error) => {
      console.error("Error loading CSV:", error);
    });
};
