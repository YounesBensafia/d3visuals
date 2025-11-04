window.onload = function () {
  // KDE plot of passenger ages (project_6)
  const outerWidth = 700;
  const outerHeight = 460;
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const width = outerWidth - margin.left - margin.right;
  const height = outerHeight - margin.top - margin.bottom;

  const container = d3.select("#chart").empty()
    ? d3.select("body")
    : d3.select("#chart");

  const svg = container
    .append("svg")
    .attr("width", outerWidth)
    .attr("height", outerHeight)
    .style("background", "#fff")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // helper kernel and KDE (unweighted)
  function gaussianKernel(u) {
    return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
  }

  function kde(kernel, bandwidth, values, domain, samples = 200) {
    const [min, max] = domain;
    const step = (max - min) / (samples - 1);
    const density = [];
    for (let i = 0; i < samples; i++) {
      const x = min + i * step;
      let sum = 0;
      for (const v of values) sum += kernel((x - v) / bandwidth);
      density.push({ x, y: sum / (values.length * bandwidth) });
    }
    return density;
  }

  // load data
  d3.csv("../data/titanic-data.csv")
    .then((raw) => {
      // parse ages
      const ages = raw.map((d) => +d.Age).filter((a) => !isNaN(a));
      if (ages.length === 0) {
        d3.select(container.node())
          .append("p")
          .text("No Age values found in CSV.");
        console.error("No Age values found in CSV");
        return;
      }

      // scales
      const x = d3
        .scaleLinear()
        .domain(d3.extent(ages))
        .range([0, width])
        .nice();
      // bandwidth changed to 10 as requested
      const density = kde(gaussianKernel, 3, ages, d3.extent(ages), 300);
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(density, (d) => d.y)])
        .range([height, 0])
        .nice();

      // axes
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
      svg.append("g").call(d3.axisLeft(y));

      // line
      const line = d3
        .line()
        .x((d) => x(d.x))
        .y((d) => y(d.y))
        .curve(d3.curveBasis);
      svg
        .append("path")
        .datum(density)
        .attr("fill", "none")
        .attr("stroke", "#1f77b4")
        .attr("stroke-width", 2)
        .attr("d", line);

      // area under curve
      const area = d3
        .area()
        .x((d) => x(d.x))
        .y0(height)
        .y1((d) => y(d.y))
        .curve(d3.curveBasis);
      svg
        .append("path")
        .datum(density)
        .attr("fill", "#1f77b4")
        .attr("opacity", 0.15)
        .attr("d", area);

      // labels
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Age");
      svg
        .append("text")
        .attr("transform", `translate(-40, ${height / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .text("Density");

      // title
      d3.select(container.node())
        .select("svg")
        .append("text")
        .attr("x", outerWidth / 2)
        .attr("y", 16)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("KDE of Titanic passenger ages");
    })
    .catch((err) => {
      console.error("Failed to load ../data/titanic-data.csv", err);
      d3.select(container.node())
        .append("p")
        .text("Error loading CSV (see console)");
    });
};
