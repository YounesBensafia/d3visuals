window.onload = function () {
  const margin = { top: 40, right: 20, bottom: 80, left: 220 };
  const width = 900 - margin.left - margin.right;
  const height = 700 - margin.top - margin.bottom;

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  d3.csv("../../datasets//us-cities.csv").then((data) => {
    data.forEach((d) => {
      d.population = +d.population;
      d.rank = +d.rank;
      d.place = d.place;
    });

    const display = data.slice(0, 20);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(display, (d) => d.population)])
      .range([0, width]);

    const y = d3
      .scaleBand()
      .domain(display.map((d) => d.place))
      .range([0, height])
      .padding(0.15);

    svg
      .append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll("text")
      .style("font-size", "12px");

    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("~s")));

    const bars = svg
      .selectAll(".bar")
      .data(display)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.place))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", (d) => x(d.population))
      .style("fill", "#69b3a2");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .attr("text-anchor", "middle")
      .text("Population");

    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 40)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("City");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Top 20 US Cities by Population");

    const margin2 = { top: 20, right: 20, bottom: 50, left: 220 };
    const width2 = width;
    const height2 = 420;

    const svg2 = d3
      .select("#chart")
      .append("svg")
      .attr("width", width2 + margin2.left + margin2.right)
      .attr("height", height2 + margin2.top + margin2.bottom)
      .style("margin-top", "18px")
      .append("g")
      .attr("transform", `translate(${margin2.left},${margin2.top})`);

    const scatterData = display;

    const x2 = d3
      .scaleLinear()
      .domain([0, d3.max(scatterData, (d) => d.population)])
      .nice()
      .range([0, width2]);

    const y2 = d3
      .scaleBand()
      .domain(scatterData.map((d) => d.place))
      .range([0, scatterData.length * 18])
      .padding(0.25);

    const innerHeight2 = y2.range()[1] + 40;
    d3.select(svg2.node().parentNode).attr(
      "height",
      innerHeight2 + margin2.top + margin2.bottom
    );

    svg2
      .append("g")
      .attr("transform", `translate(0, ${innerHeight2})`)
      .call(d3.axisBottom(x2).ticks(6).tickFormat(d3.format("~s")));

    svg2
      .append("g")
      .call(d3.axisLeft(y2).tickSize(0))
      .selectAll("text")
      .style("font-size", "12px");

    svg2
      .selectAll(".point")
      .data(scatterData)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", (d) => x2(d.population))
      .attr("cy", (d) => y2(d.place) + y2.bandwidth() / 2)
      .attr("r", 6)
      .style("fill", "orange")
      .style("stroke", "#fff")
      .style("stroke-width", 1)
      .style("opacity", 0.95);

    const tooltip2 = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip2")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "#fff")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    svg2
      .append("text")
      .attr("x", width2 / 2)
      .attr("y", innerHeight2 + 40)
      .attr("text-anchor", "middle")
      .text("Population");

    svg2
      .append("text")
      .attr("x", width2 / 2)
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Population (points aligned with cities)");
  });
};
