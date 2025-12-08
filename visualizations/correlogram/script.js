window.onload = function () {
  const filePath = "../../datasets//glass.csv"; // dataset

  const tooltip = d3.select("#tooltip");

  d3.csv(filePath).then((raw) => {
    // Extract numeric columns
    let numericCols = raw.columns.filter((col) =>
      raw.every((d) => !isNaN(+d[col]))
    );

    // Remove Type from the list
    numericCols = numericCols.filter((col) => col !== "Type");

    // --- REMOVE COLUMNS AS REQUESTED ---
    const verticalCols = numericCols.filter((col) => col !== "RI"); // remove vertically

    // Convert rows
    const data = raw.map((d) => {
      let row = {};
      numericCols.forEach((col) => (row[col] = +d[col]));
      return row;
    });

    // Normalize/Standardize the data (z-score normalization)
    numericCols.forEach((col) => {
      const values = data.map((d) => d[col]);
      const mean = d3.mean(values);
      const std = Math.sqrt(d3.variance(values));
      data.forEach((d) => {
        d[col] = (d[col] - mean) / std;
      });
    });

    // Correlation function
    function correlation(x, y) {
      const n = x.length;
      const meanX = d3.mean(x);
      const meanY = d3.mean(y);
      const cov =
        d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY))) / (n - 1);
      const stdX = Math.sqrt(
        d3.sum(x.map((xi) => (xi - meanX) ** 2)) / (n - 1)
      );
      const stdY = Math.sqrt(
        d3.sum(y.map((yi) => (yi - meanY) ** 2)) / (n - 1)
      );
      return cov / (stdX * stdY);
    }

    const corrMatrix = [];
    verticalCols.forEach((rowAttr, rIdx) => {
      numericCols.forEach((colAttr, cIdx) => {
        // Only keep TOP-LEFT region (cIdx ≤ rIdx)
        if (cIdx > rIdx) return;

        const x = data.map((d) => d[rowAttr]);
        const y = data.map((d) => d[colAttr]);

        corrMatrix.push({
          row: rowAttr,
          col: colAttr,
          value: correlation(x, y),
        });
      });
    });

    // ==== SVG AND SCALES ====

    const size = 650;
    const padding = 140;

    const svg = d3
      .select("#chart")
      .append("svg")
      .attr("width", size + 200)
      .attr("height", size + 50);

    const cellSize = (size - padding) / numericCols.length;

    const xScale = d3.scaleBand().domain(numericCols).range([padding, size]);

    const yScale = d3
      .scaleBand()
      .domain(verticalCols.slice().reverse()) // reverse vertically
      .range([padding, size]);

    // Color scale
    const color = d3
      .scaleSequential()
      .domain([-1, 1])
      .interpolator(d3.interpolateRdBu);

    // Circle radius
    const radius = d3
      .scaleSqrt()
      .domain([0, 1])
      .range([0, cellSize / 2]); // larger circles

    // ==== DRAW CIRCLES ====
    svg
      .selectAll("circle")
      .data(corrMatrix)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.col) + cellSize / 2)
      .attr("cy", (d) => yScale(d.row) + cellSize / 2)
      .attr("r", (d) => radius(Math.abs(d.value)))
      .attr("fill", (d) => color(d.value))
      .attr("stroke", "#222")
      .on("mouseover", function (event, d) {
        tooltip.style("opacity", 1).html(`
                    <strong>${d.row} vs ${d.col}</strong><br>
                    Correlation: ${d.value.toFixed(3)}
                `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // ==== AXIS LABELS ====

    svg
      .selectAll(".xLabel")
      .data(numericCols)
      .enter()
      .append("text")
      .attr("x", (d) => xScale(d) + cellSize / 2)
      .attr("y", padding - 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .text((d) => d);

    svg
      .selectAll(".yLabel")
      .data(verticalCols.slice().reverse())
      .enter()
      .append("text")
      .attr("x", padding - 15)
      .attr("y", (d) => yScale(d) + cellSize / 2 + 4)
      .attr("text-anchor", "end")
      .attr("font-size", "13px")
      .text((d) => d);

    // ==== COLOR LEGEND BAR ====

    const legendWidth = 20;
    const legendHeight = 200;

    const legendScale = d3
      .scaleLinear()
      .domain([-1, 1])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(5);

    const legend = svg
      .append("g")
      .attr("transform", `translate(${size + 80}, ${padding})`);

    // gradient
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "grad")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", color(-1));
    gradient.append("stop").attr("offset", "50%").attr("stop-color", color(0));
    gradient.append("stop").attr("offset", "100%").attr("stop-color", color(1));

    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#grad)");

    legend
      .append("g")
      .attr("transform", `translate(${legendWidth}, 0)`)
      .call(legendAxis);
  });
};
