window.onload = function () {
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", 300)
    .attr("height", 200);

  d3.csv("./data/named_colors_css.csv")
    .then((data) => {
      data.forEach((d, index) => {
        console.log(`${index}: ${d.Name} - ${d.Hex}`);
      });

      if (data.length > 4) {
        svg
          .append("circle")
          .attr("cx", 150)
          .attr("cy", 100)
          .attr("r", 50)
          .style("fill", data[8].Hex);

        console.log("Circle created with color:", data[8].Name, data[8].Hex);
      }
    })
    .catch((error) => {
      console.error("Error loading CSV:", error);
    });
};
