function main(container) {
  // Accept either a DOM element or a selector string
  const sel =
    typeof container === "string"
      ? d3.select(container)
      : d3.select(container || document.body);

  const width = 1200;
  const height = 700;

  // remove existing SVG/tooltip if re-running
  sel.selectAll("svg").remove();
  sel.selectAll(".treemap-tooltip").remove();

  // 1. Init SVG container with background gradient
  const svg = sel
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)")
    .style("border-radius", "8px");

  // Add defs for gradients
  const defs = svg.append("defs");

  // Create a subtle glow filter
  const filter = defs.append("filter").attr("id", "glow");
  filter
    .append("feGaussianBlur")
    .attr("stdDeviation", "2")
    .attr("result", "coloredBlur");
  const feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  const tooltip = sel
    .append("div")
    .attr("class", "treemap-tooltip")
    .style("position", "absolute")
    .style("background", "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)")
    .style("color", "white")
    .style("border", "none")
    .style("border-radius", "12px")
    .style("padding", "14px 18px")
    .style(
      "box-shadow",
      "0 10px 40px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)"
    )
    .style("font-family", "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")
    .style("font-size", "13px")
    .style("line-height", "1.6")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("transition", "opacity 0.2s ease");

  d3.csv("../data/coffee_analysis.csv")
    .then((data) => {
      
      data.forEach((d) => {
        if (!d.roast || String(d.roast).trim() === "") d.roast = "Unknown";
        if (!d.loc_country || String(d.loc_country).trim() === "")
          d.loc_country = "Unknown";
      });

      const nestedData = d3.group(
        data,
        (d) => d.roast,
        (d) => d.loc_country
      );

      // build hierarchy
      const hierarchyData = {
        name: "root",
        children: Array.from(nestedData, ([key, value]) => ({
          name: key,
          children: Array.from(value, ([subKey, subValues]) => ({
            name: subKey,
            value: subValues.length,
          })),
        })),
      };

      const root = d3
        .hierarchy(hierarchyData)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value);

      const treemap = d3
        .treemap()
        .size([width, height])
        .paddingInner(3)
        .paddingOuter(4)
        .round(true);
      treemap(root);

      // Coffee-themed warm color palette for roasts
      const roastNames = root.children
        ? root.children.map((d) => d.data.name)
        : ["Unknown"];
      const coffeeColors = [
        "#8B4513", // SaddleBrown
        "#D2691E", // Chocolate
        "#CD853F", // Peru
        "#DEB887",
        "#F4A460",
        "#DAA520",
        "#B8860B",
        "#A0522D",
        "#6B4423",
        "#8B7355",
      ];
      const roastColor = d3
        .scaleOrdinal()
        .domain(roastNames)
        .range(coffeeColors);

      // Vibrant colors for countries
      const countryColor = d3.scaleOrdinal(d3.schemePaired);

      // Draw group frames (roast)
      const groups = svg
        .selectAll("g.roast-group")
        .data(root.children || [])
        .enter()
        .append("g")
        .attr("class", "roast-group");

      groups
        .append("rect")
        .attr("class", "roast-rect")
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0)
        .attr("width", (d) => Math.max(0, d.x1 - d.x0))
        .attr("height", (d) => Math.max(0, d.y1 - d.y0))
        .attr("fill", "none")
        .attr("stroke", (d) => roastColor(d.data.name))
        .attr("stroke-width", 3)
        .attr("rx", 6)
        .attr("ry", 6)
        .style("cursor", "pointer")
        .style("transition", "all 0.3s ease")
        .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))")
        .on("mouseover", function (event, d) {
          const countryCount = d.children ? d.children.length : 0;
          const totalRecords = d.value || 0;
          const grandTotal = root.value || 1;
          const percentage = ((totalRecords / grandTotal) * 100).toFixed(1);

          tooltip
            .style("opacity", 0.95)
            .html(
              `<div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${
                d.data.name
              } Roast</div>
               <div style="font-size: 12px; opacity: 0.9;">${countryCount} ${
                countryCount === 1 ? "Country" : "Countries"
              }</div>
               <div style="font-size: 12px; opacity: 0.9;">${percentage}% of Total</div>`
            )
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY - 10}px`);

          // highlight with glow
          d3.select(this)
            .attr("stroke", "#FFD700")
            .attr("stroke-width", 5)
            .style("filter", "drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))");
          svg
            .selectAll("rect.country-rect")
            .filter((node) => node.parent === d)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("opacity", 1);

          svg
            .selectAll("rect.country-rect")
            .filter((node) => node.parent !== d)
            .attr("opacity", 0.3);
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function (event, d) {
          tooltip.style("opacity", 0);
          d3.select(this)
            .attr("stroke", roastColor(d.data.name))
            .attr("stroke-width", 3)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");
          svg
            .selectAll("rect.country-rect")
            .attr("stroke", null)
            .attr("opacity", 1);
        });

      // Draw country rectangles (leaves)
      const nodes = root.leaves();

      svg
        .selectAll("rect.country-rect")
        .data(nodes)
        .enter()
        .append("rect")
        .attr("class", "country-rect")
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0)
        .attr("width", (d) => Math.max(0, d.x1 - d.x0))
        .attr("height", (d) => Math.max(0, d.y1 - d.y0))
        .attr("fill", (d) => countryColor(d.data.name))
        .attr("rx", 4)
        .attr("ry", 4)
        .style("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .style("opacity", 0.9)
        .on("mouseover", function (event, d) {
          event.stopPropagation();
          const parentTotal = d.parent.value || 1;
          const percentage = ((d.value / parentTotal) * 100).toFixed(1);

          tooltip
            .style("opacity", 0.95)
            .html(
              `<div style="font-size: 15px; font-weight: 600; margin-bottom: 6px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${d.data.name}</div>
               <div style="font-size: 12px; opacity: 0.9;">Roast: ${d.parent.data.name}</div>
               <div style="font-size: 12px; opacity: 0.9;">${percentage}% of ${d.parent.data.name}</div>`
            )
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY - 10}px`);
          d3.select(this)
            .attr("stroke", "#FFD700")
            .attr("stroke-width", 3)
            .style("opacity", 1)
            .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.25))");
        })
        .on("mousemove", function (event) {
          event.stopPropagation();
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function (event) {
          event.stopPropagation();
          tooltip.style("opacity", 0);
          d3.select(this)
            .attr("stroke", null)
            .style("opacity", 0.9)
            .style("filter", "none");
        });

      // Labels for sufficiently large nodes
      svg
        .selectAll("text.country-label")
        .data(nodes.filter((d) => d.x1 - d.x0 > 50 && d.y1 - d.y0 > 25))
        .enter()
        .append("text")
        .attr("class", "country-label")
        .attr("x", (d) => d.x0 + (d.x1 - d.x0) / 2)
        .attr("y", (d) => d.y0 + (d.y1 - d.y0) / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-family", "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("fill", "white")
        .style(
          "text-shadow",
          "0 1px 3px rgba(0, 0, 0, 0.8), 0 0 5px rgba(0, 0, 0, 0.5)"
        )
        .style("pointer-events", "none")
        .text((d) => d.data.name);

      // Add title
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-family", "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")
        .attr("font-size", "24px")
        .attr("font-weight", "700")
        .attr("fill", "#2c3e50")
        .style("text-shadow", "0 2px 4px rgba(0,0,0,0.1)")
    })
    .catch((err) => {
      sel.append("p").text("Error loading coffee_analysis.csv: " + err.message);
      console.error(err);
    });
}

// Run on element with id "container" if exists, otherwise try "chart", otherwise body
const containerEl =
  document.getElementById("container") ||
  document.getElementById("chart") ||
  document.body;
main(containerEl);
