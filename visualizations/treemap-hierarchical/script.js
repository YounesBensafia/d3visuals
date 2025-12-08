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

  d3.csv("../../datasets//coffee_analysis.csv")
    .then((data) => {
      data.forEach((d) => {
        // Extract year from review_date
        const dateStr = String(d.review_date || "").trim();
        const yearMatch = dateStr.match(/\d{4}/);
        d.review_year = yearMatch ? yearMatch[0] : "Unknown";

        if (!d.roast || String(d.roast).trim() === "") d.roast = "Unknown";
        if (!d.loc_country || String(d.loc_country).trim() === "")
          d.loc_country = "Unknown";
      });

      // Count occurrences of each year
      const yearCounts = d3.rollup(
        data,
        (v) => v.length,
        (d) => d.review_year
      );

      // Get top 5 most frequent years
      const top5Years = Array.from(yearCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((d) => d[0]);

      // Filter data to only include top 5 years
      const filteredData = data.filter((d) =>
        top5Years.includes(d.review_year)
      );

      // Group by review_year -> roast -> loc_country
      const nestedData = d3.group(
        filteredData,
        (d) => d.review_year,
        (d) => d.roast,
        (d) => d.loc_country
      );

      // build hierarchy with 3 levels
      const hierarchyData = {
        name: "root",
        children: Array.from(nestedData, ([year, roastMap]) => ({
          name: year,
          children: Array.from(roastMap, ([roast, countryMap]) => ({
            name: roast,
            children: Array.from(countryMap, ([country, records]) => ({
              name: country,
              value: records.length,
            })),
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

      // Color palette for years (top level)
      const yearNames = root.children
        ? root.children.map((d) => d.data.name)
        : ["Unknown"];
      const yearColors = [
        "#3498db",
        "#e74c3c",
        "#2ecc71",
        "#f39c12",
        "#9b59b6",
      ];
      const yearColor = d3.scaleOrdinal().domain(yearNames).range(yearColors);

      // Coffee-themed color palette for roasts (second level)
      const coffeeColors = [
        "#8B4513",
        "#D2691E",
        "#CD853F",
        "#DEB887",
        "#F4A460",
        "#DAA520",
        "#B8860B",
        "#A0522D",
        "#6B4423",
        "#8B7355",
      ];
      const roastColor = d3.scaleOrdinal().range(coffeeColors);

      // Vibrant colors for countries (third level)
      const countryColor = d3.scaleOrdinal(d3.schemePaired);

      // Draw group frames (years - top level)
      const yearGroups = svg
        .selectAll("g.year-group")
        .data(root.children || [])
        .enter()
        .append("g")
        .attr("class", "year-group");

      yearGroups
        .append("rect")
        .attr("class", "year-rect")
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0)
        .attr("width", (d) => Math.max(0, d.x1 - d.x0))
        .attr("height", (d) => Math.max(0, d.y1 - d.y0))
        .attr("fill", "none")
        .attr("stroke", (d) => yearColor(d.data.name))
        .attr("stroke-width", 4)
        .attr("rx", 8)
        .attr("ry", 8)
        .style("cursor", "pointer")
        .style("transition", "all 0.3s ease")
        .style("filter", "drop-shadow(0 3px 6px rgba(0,0,0,0.15))")
        .on("mouseover", function (event, d) {
          const roastCount = d.children ? d.children.length : 0;
          const totalRecords = d.value || 0;
          const grandTotal = root.value || 1;
          const percentage = ((totalRecords / grandTotal) * 100).toFixed(1);

          tooltip
            .style("opacity", 0.95)
            .html(
              `<div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">Year ${
                d.data.name
              }</div>
               <div style="font-size: 12px; opacity: 0.9;">${roastCount} Roast ${
                roastCount === 1 ? "Type" : "Types"
              }</div>
               <div style="font-size: 12px; opacity: 0.9;">${percentage}% of Total</div>`
            )
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY - 10}px`);

          d3.select(this)
            .attr("stroke", "#FFD700")
            .attr("stroke-width", 6)
            .style("filter", "drop-shadow(0 0 10px rgba(255, 215, 0, 0.7))");
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function (event, d) {
          tooltip.style("opacity", 0);
          d3.select(this)
            .attr("stroke", yearColor(d.data.name))
            .attr("stroke-width", 4)
            .style("filter", "drop-shadow(0 3px 6px rgba(0,0,0,0.15))");
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
          const year = d.parent.parent ? d.parent.parent.data.name : "Unknown";
          const roast = d.parent.data.name;

          tooltip
            .style("opacity", 0.95)
            .html(
              `<div style="font-size: 15px; font-weight: 600; margin-bottom: 6px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${d.data.name}</div>
               <div style="font-size: 12px; opacity: 0.9;">Year: ${year}</div>
               <div style="font-size: 12px; opacity: 0.9;">Roast: ${roast}</div>
               <div style="font-size: 12px; opacity: 0.9;">${percentage}% of ${roast}</div>`
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
        .style("text-shadow", "0 2px 4px rgba(0,0,0,0.1)");
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
