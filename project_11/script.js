window.onload = function () {
  const csvPath = "../data/glass.csv"; // relative to project_11/index.html

  // Feature columns to use for PCA
  const featureNames = ["RI", "Na", "Mg", "Al", "Si", "K", "Ca", "Ba", "Fe"];

  // Sizes for the two plots
  const scatterSize = { width: 700, height: 450 };
  const loadingsSize = { width: 400, height: 400 };

  function standardize(matrix) {
    const n = matrix.length;
    const p = matrix[0].length;
    const means = Array(p).fill(0);
    for (let j = 0; j < p; j++) {
      means[j] = numeric.sum(matrix.map((r) => r[j])) / n;
    }
    const stds = Array(p).fill(0);
    for (let j = 0; j < p; j++) {
      const arr = matrix.map((r) => r[j]);
      const m = means[j];
      const variance = numeric.sum(arr.map((v) => (v - m) * (v - m))) / (n - 1);
      stds[j] = Math.sqrt(variance) || 1;
    }
    const Z = matrix.map((row) => row.map((v, j) => (v - means[j]) / stds[j]));
    return { Z, means, stds };
  }

  // Draw PCA scatter and loadings
  d3.csv(csvPath, d3.autoType)
    .then((data) => {
      if (!data || data.length === 0) {
        console.error("No data loaded for PCA.");
        return;
      }

      // Build numeric matrix X (n x p) and labels
      const X = data.map((d) => featureNames.map((f) => +d[f]));
      const labels = data.map((d) => d.Type);

      // 1) Standardize
      const { Z } = standardize(X);

      // 2-4) Use SVD to get principal directions (more stable than numeric.eig of covariance)
      // Z is n x p, numeric.svd expects a matrix
      const svd = numeric.svd(Z);
      // svd.V is p x p, columns are right singular vectors (principal axes)
      const V = svd.V;

      // 5) select top k=2 eigenvectors
      const V2 = V.map((row) => [row[0], row[1]]); // p x 2

      // 6) project data into new eigenvectors: projected = Z * V2  (n x 2)
      const projected = numeric.dot(Z, V2);

      // Prepare color scale for Types (avoid purple)
      const uniqueTypes = Array.from(new Set(labels.map((d) => String(d))));
      const palette = [
        "#006d5b", // deep teal
        "#ff7f0e", // orange
        "#2ca02c", // green
        "#d62728", // red
        "#e6aa00", // gold
        "#8c564b", // brown
        "#1f77b4", // blue
        "#7f7f7f", // gray
      ];
      const color = d3.scaleOrdinal().domain(uniqueTypes).range(palette);

      // --- Scatter plot ---
      const margin = { top: 20, right: 20, bottom: 40, left: 50 };
      const w = scatterSize.width - margin.left - margin.right;
      const h = scatterSize.height - margin.top - margin.bottom;

      const sx = d3
        .scaleLinear()
        .domain(d3.extent(projected.map((d) => d[0])))
        .range([0, w])
        .nice();
      const sy = d3
        .scaleLinear()
        .domain(d3.extent(projected.map((d) => d[1])))
        .range([h, 0])
        .nice();

      const svg = d3
        .select("body")
        .append("svg")
        .attr("width", scatterSize.width)
        .attr("height", scatterSize.height)
        .style("font-family", "sans-serif");

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // axes
      g.append("g")
        .attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(sx));
      g.append("g").call(d3.axisLeft(sy));

      // tooltip (simple div)
      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "pca-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(255,255,255,0.95)")
        .style("border", "1px solid #ddd")
        .style("padding", "8px")
        .style("font-size", "12px")
        .style("color", "#111")
        .style("box-shadow", "0 2px 6px rgba(0,0,0,0.12)")
        .style("border-radius", "4px")
        .style("display", "none");

      g.selectAll("circle")
        .data(projected)
        .enter()
        .append("circle")
        .attr("cx", (d) => sx(d[0]))
        .attr("cy", (d) => sy(d[1]))
        .attr("r", 5)
        .attr("fill", (d, i) => color(String(labels[i])))
        .attr("fill-opacity", 0.85)
        .attr("stroke", "#222")
        .attr("stroke-width", 0.3)
        .on("mouseenter", function (event, d) {
          const i = projected.indexOf(d);
          const txt = featureNames
            .map((f, j) => `<strong>${f}</strong>: ${data[i][f]}`)
            .join("<br/>");
          tooltip
            .html(
              `<div><strong>Type:</strong> ${labels[i]}</div><div style="margin-top:6px">${txt}</div>`
            )
            .style("display", "block");
          d3.select(this).attr("r", 7);
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", event.pageX + 12 + "px")
            .style("top", event.pageY + 12 + "px");
        })
        .on("mouseleave", function () {
          d3.select(this).attr("r", 5);
          tooltip.style("display", "none");
        });

      // compute variance explained from SVD singular values
      const svals = svd.S || [];
      const varExplained = svals.map((s) => s * s);
      const totalVar = numeric.sum(varExplained);
      const explainedPercents = varExplained.map((v) => (100 * v) / totalVar);

      svg
        .append("text")
        .attr("x", margin.left + 6)
        .attr("y", margin.top + 12)
        .style("font-weight", "600")
        .text(
          `PCA (2D) - Glass dataset (PC1 ${
            explainedPercents[0]?.toFixed(1) || "0"
          }% , PC2 ${explainedPercents[1]?.toFixed(1) || "0"}%)`
        );

      // legend
      const legend = svg
        .append("g")
        .attr("transform", `translate(${scatterSize.width - 140},${20})`);
      uniqueTypes.forEach((t, idx) => {
        const le = legend
          .append("g")
          .attr("transform", `translate(0, ${idx * 18})`);
        le.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", color(t))
          .attr("rx", 2)
          .attr("ry", 2);
        le.append("text")
          .attr("x", 16)
          .attr("y", 10)
          .text(t)
          .style("font-size", "12px")
          .style("fill", "#222");
      });

      // --- Loadings plot (feature vectors from origin) ---
      const Lw = loadingsSize.width;
      const Lh = loadingsSize.height;
      const lmargin = { top: 20, right: 20, bottom: 20, left: 20 };
      const lplotW = Lw - lmargin.left - lmargin.right;
      const lplotH = Lh - lmargin.top - lmargin.bottom;

      // Loadings are rows of V2 (p x 2): each feature's coordinate in PC1/PC2
      const loadings = V2; // p x 2

      // Determine a symmetric scale so vectors are visible
      const maxLoading = d3.max(loadings.flat().map(Math.abs)) || 1;
      const scaleFactor = ((Math.min(lplotW, lplotH) / 2) * 0.9) / maxLoading;

      const lsvg = d3
        .select("body")
        .append("svg")
        .attr("width", Lw)
        .attr("height", Lh)
        .style("font-family", "sans-serif");

      const lg = lsvg
        .append("g")
        .attr(
          "transform",
          `translate(${lmargin.left + lplotW / 2},${lmargin.top + lplotH / 2})`
        );

      // axes
      lg.append("line")
        .attr("x1", -lplotW / 2)
        .attr("y1", 0)
        .attr("x2", lplotW / 2)
        .attr("y2", 0)
        .attr("stroke", "#bbb");
      lg.append("line")
        .attr("x1", 0)
        .attr("y1", -lplotH / 2)
        .attr("x2", 0)
        .attr("y2", lplotH / 2)
        .attr("stroke", "#bbb");

      // arrows for each feature
      const arrowGroup = lg
        .selectAll("g.feature")
        .data(loadings)
        .enter()
        .append("g")
        .attr("class", "feature");
      // arrow color: warm coffee brown
      const arrowColor = "#6b3f1a";
      arrowGroup
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d) => d[0] * scaleFactor)
        .attr("y2", (d) => -d[1] * scaleFactor)
        .attr("stroke", arrowColor)
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

      // marker arrow definition
      lsvg
        .append("defs")
        .append("marker")
        .attr("id", "arrow")
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("refX", 8)
        .attr("refY", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,0 L0,8 L8,4 z")
        .attr("fill", arrowColor);

      arrowGroup
        .append("circle")
        .attr("cx", (d) => d[0] * scaleFactor)
        .attr("cy", (d) => -d[1] * scaleFactor)
        .attr("r", 3.5)
        .attr("fill", arrowColor);

      arrowGroup
        .append("text")
        .attr("x", (d) => d[0] * scaleFactor + 8)
        .attr("y", (d) => -d[1] * scaleFactor - 8)
        .text((d, i) => featureNames[i])
        .style("font-size", "12px")
        .style("fill", "#333");

      lsvg
        .append("text")
        .attr("x", 8)
        .attr("y", 16)
        .style("font-weight", "600")
        .text("PCA Loadings (feature contributions to PC1/PC2)");

      // Log some results to console for inspection
      console.log("Projected (first 5 rows):", projected.slice(0, 5));
      console.log("Top 2 principal directions (V2):", V2);
    })
    .catch((err) => {
      console.error("Error loading CSV for PCA:", err);
    });
};
