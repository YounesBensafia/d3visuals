window.onload = function () {
  const columns = 15; 
  const circleRadius = 24;
  const hSpacing = 80;
  const vSpacing = 75;
  const margin = { top: 30, right: 20, bottom: 100, left: 20 };

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", 1500)
    .attr("height", 400)
    .style("background-color", "white");

  d3.csv("./data/named_colors_css.csv").then((data) => {
    const n = data.length;
    const rows = Math.ceil(n / columns);

    const svgWidth = margin.left + margin.right + columns * hSpacing;
    const svgHeight = margin.top + margin.bottom + rows * vSpacing;
    svg.attr("width", svgWidth).attr("height", svgHeight);

    const group = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const items = group
      .selectAll("g.colorItem")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "colorItem")
      .attr("transform", (d, i) => {
        const row = Math.floor(i / columns);
        const col = i % columns;
        const x = col * hSpacing + circleRadius;
        const y = row * vSpacing + circleRadius;
        return `translate(${x}, ${y})`;
      });

    items
      .append("circle")
      .attr("r", circleRadius)
      .style("fill", (d) => d.Hex)
      .style("stroke", "#000")
      .style("stroke-width", 2)

    items
      .append("text")
      .text((d) => d.Name)
      .attr("y", circleRadius + 18)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .style("font-size", "12px")
      .style("fill", "#333");
  });
};
