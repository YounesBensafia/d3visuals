window.onload = function () {
  // Container fallback
  let container = d3.select("#chart");
  if (container.empty()) container = d3.select("#visualization");
  if (container.empty()) container = d3.select("body");

  // Set up dimensions
  const margin = { top: 60, right: 50, bottom: 110, left: 80 };
  const width = 1200 - margin.left - margin.right;
  const height = 650 - margin.top - margin.bottom;

  // Create SVG with enhanced styling
  const svg = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background", "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)")
    .style("border-radius", "8px")
    .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Load abalone CSV from repo-level data folder
  d3.csv("../data/abalone.csv")
    .then((rows) => {
      if (!rows || rows.length === 0) {
        container.append("p").text("No data found in abalone.csv");
        return;
      }

      // Get all numeric columns
      const cols = Object.keys(rows[0]);
      const numericColumns = cols.filter(
        (c) => c !== "Sex" && rows.some((r) => r[c] !== "" && !isNaN(+r[c]))
      );

      if (numericColumns.length === 0) {
        container.append("p").text("No numeric columns found in abalone.csv");
        return;
      }

      // Normalize data using z-score normalization: (x - mean) / std
      function normalizeData(values) {
        const mean = d3.mean(values);
        const std = d3.deviation(values);
        return values.map((v) => (v - mean) / std);
      }

      // Calculate boxplot statistics from normalized values
      function calculateBoxplotStats(normalizedValues, originalValues) {
        const sorted = [...normalizedValues].sort(d3.ascending);
        const q1 = d3.quantile(sorted, 0.25);
        const median = d3.quantile(sorted, 0.5);
        const q3 = d3.quantile(sorted, 0.75);
        const iqr = q3 - q1;
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;

        // Find actual whisker values (min/max within fences)
        const lowerWhisker =
          d3.min(sorted.filter((d) => d >= lowerFence)) || q1;
        const upperWhisker =
          d3.max(sorted.filter((d) => d <= upperFence)) || q3;

        // Find outliers
        const outliers = sorted.filter((d) => d < lowerFence || d > upperFence);

        return {
          q1,
          median,
          q3,
          lowerWhisker,
          upperWhisker,
          outliers,
          min: d3.min(sorted),
          max: d3.max(sorted),
          originalMin: d3.min(originalValues),
          originalMax: d3.max(originalValues),
        };
      }

      // Prepare boxplot data with normalization for each column
      const boxplotData = numericColumns.map((col) => {
        const originalValues = rows
          .map((r) => +r[col])
          .filter((v) => !isNaN(v));
        const normalizedValues = normalizeData(originalValues);
        return {
          column: col,
          normalizedValues: normalizedValues,
          stats: calculateBoxplotStats(normalizedValues, originalValues),
        };
      });

      // X scale (scaleBand for categorical - each variable gets a position)
      const x = d3
        .scaleBand()
        .domain(numericColumns)
        .range([0, width])
        .padding(0.3);

      // Y scale with fixed range from -4 to +7
      const y = d3.scaleLinear().domain([-4, 7]).range([height, 0]);

      // Add gradient definition for boxes
      const defs = svg.append("defs");
      const gradient = defs
        .append("linearGradient")
        .attr("id", "boxGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");
      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#69b3a2");
      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#5a9e8f");

      // Add grid lines
      svg
        .append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).ticks(10).tickSize(-width).tickFormat(""))
        .style("stroke", "#e0e0e0")
        .style("stroke-opacity", 0.3)
        .style("stroke-dasharray", "2,2");

      // Draw boxplots for each variable
      boxplotData.forEach((d) => {
        const center = x(d.column) + x.bandwidth() / 2;
        const boxWidth = x.bandwidth() * 0.6;
        const normalizedValues = d.normalizedValues;

        // Whiskers (vertical lines from box to whisker ends) with enhanced styling
        svg
          .append("line")
          .attr("x1", center)
          .attr("x2", center)
          .attr("y1", y(d.stats.lowerWhisker))
          .attr("y2", y(d.stats.q1))
          .attr("stroke", "#2d5f5d")
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round");

        svg
          .append("line")
          .attr("x1", center)
          .attr("x2", center)
          .attr("y1", y(d.stats.q3))
          .attr("y2", y(d.stats.upperWhisker))
          .attr("stroke", "#2d5f5d")
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round");

        // Whisker caps (horizontal lines at whisker ends) with enhanced styling
        svg
          .append("line")
          .attr("x1", center - boxWidth / 3)
          .attr("x2", center + boxWidth / 3)
          .attr("y1", y(d.stats.lowerWhisker))
          .attr("y2", y(d.stats.lowerWhisker))
          .attr("stroke", "#2d5f5d")
          .attr("stroke-width", 2.5)
          .attr("stroke-linecap", "round");

        svg
          .append("line")
          .attr("x1", center - boxWidth / 3)
          .attr("x2", center + boxWidth / 3)
          .attr("y1", y(d.stats.upperWhisker))
          .attr("y2", y(d.stats.upperWhisker))
          .attr("stroke", "#2d5f5d")
          .attr("stroke-width", 2.5)
          .attr("stroke-linecap", "round");

        // Box (Q1 to Q3) with hover effect
        svg
          .append("rect")
          .attr("class", "box")
          .attr("x", center - boxWidth / 2)
          .attr("y", y(d.stats.q3))
          .attr("width", boxWidth)
          .attr("height", Math.max(1, y(d.stats.q1) - y(d.stats.q3)))
          .attr("fill", "url(#boxGradient)")
          .attr("stroke", "#2d5f5d")
          .attr("stroke-width", 2.5)
          .attr("opacity", 0.85)
          .attr("rx", 4)
          .attr("ry", 4)
          .style("cursor", "pointer")
          .on("mouseover", function () {
            d3.select(this).attr("opacity", 1).attr("stroke-width", 3);
          })
          .on("mouseout", function () {
            d3.select(this).attr("opacity", 0.85).attr("stroke-width", 2.5);
          });

        // Median line with enhanced styling
        svg
          .append("line")
          .attr("x1", center - boxWidth / 2)
          .attr("x2", center + boxWidth / 2)
          .attr("y1", y(d.stats.median))
          .attr("y2", y(d.stats.median))
          .attr("stroke", "#0a2120")
          .attr("stroke-width", 3.5)
          .attr("stroke-linecap", "round");

        // Mean line (dashed) with enhanced styling
        const mean = d3.mean(normalizedValues);
        svg
          .append("line")
          .attr("x1", center - boxWidth / 2)
          .attr("x2", center + boxWidth / 2)
          .attr("y1", y(mean))
          .attr("y2", y(mean))
          .attr("stroke", "#c0392b")
          .attr("stroke-width", 2.5)
          .attr("stroke-dasharray", "6 4")
          .attr("stroke-linecap", "round");

        // Outliers with enhanced styling and hover effect
        d.stats.outliers.forEach((outlier) => {
          svg
            .append("circle")
            .attr("cx", center)
            .attr("cy", y(outlier))
            .attr("r", 4)
            .attr("fill", "#e74c3c")
            .attr("stroke", "#c0392b")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.8)
            .style("cursor", "pointer")
            .on("mouseover", function () {
              d3.select(this).attr("r", 6).attr("opacity", 1);
            })
            .on("mouseout", function () {
              d3.select(this).attr("r", 4).attr("opacity", 0.8);
            });
        });
      });

      // X axis with enhanced styling
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-family", "Arial, sans-serif")
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .style("fill", "#2c3e50");

      // Y axis with enhanced styling
      svg
        .append("g")
        .call(d3.axisLeft(y).ticks(10))
        .style("font-family", "Arial, sans-serif")
        .selectAll("text")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .style("fill", "#2c3e50");

      // Y axis label with enhanced styling
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 25)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "15px")
        .style("font-weight", "600")
        .style("fill", "#2c3e50")
        .style("font-family", "Arial, sans-serif")
        .text("Valeur normalisée (Z-score)");

      // X axis label with enhanced styling
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "15px")
        .style("font-weight", "600")
        .style("fill", "#2c3e50")
        .style("font-family", "Arial, sans-serif")
        .text("Variables");

      // Title with enhanced styling and shadow effect
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -25)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "700")
        .style("fill", "#1a252f")
        .style("font-family", "Arial, sans-serif")
        .style("text-shadow", "2px 2px 4px rgba(0,0,0,0.2)")
        .text("Boxplots des variables normalisées (Abalone)");

      // Legend
      const legend = svg.append("g").attr("transform", `translate(10, 10)`);
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#69b3a2")
        .attr("stroke", "#2d5f5d")
        .attr("opacity", 0.8);
      legend
        .append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text("Q1-Q3 (IQR)")
        .style("font-size", "11px");

      legend
        .append("line")
        .attr("x1", 0)
        .attr("x2", 15)
        .attr("y1", 28)
        .attr("y2", 28)
        .attr("stroke", "#1a3634")
        .attr("stroke-width", 3);
      legend
        .append("text")
        .attr("x", 20)
        .attr("y", 32)
        .text("Médiane")
        .style("font-size", "11px");

      legend
        .append("line")
        .attr("x1", 0)
        .attr("x2", 15)
        .attr("y1", 46)
        .attr("y2", 46)
        .attr("stroke", "#d9534f")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4 4");
      legend
        .append("text")
        .attr("x", 20)
        .attr("y", 50)
        .text("Moyenne")
        .style("font-size", "11px");

      legend
        .append("circle")
        .attr("cx", 7)
        .attr("cy", 66)
        .attr("r", 3)
        .attr("fill", "#e74c3c")
        .attr("stroke", "#c0392b");
      legend
        .append("text")
        .attr("x", 20)
        .attr("y", 70)
        .text("Outliers")
        .style("font-size", "11px");

      // Info text
      container
        .append("p")
        .style("text-align", "center")
        .style("color", "#666")
        .style("font-size", "13px")
        .html(
          "<em>Données normalisées avec Z-score (moyenne=0, écart-type=1). Whiskers: 1.5×IQR</em>"
        );
    })
    .catch((err) => {
      container.append("p").text("Error loading abalone.csv: " + err.message);
      console.error(err);
    });
};
