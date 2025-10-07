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

  d3.csv("../data/us-cities.csv")
    .then((data) => {
      data.forEach((d) => {
        d.population = +d.population;
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
    })
};
