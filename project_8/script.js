window.onload = function () {
  // Container fallback
  let container = d3.select("#chart");
  if (container.empty()) container = d3.select("#visualization");
  if (container.empty()) container = d3.select("body");

  // Set up dimensions
  const margin = { top: 60, right: 150, bottom: 80, left: 80 };
  const width = 1000 - margin.left - margin.right;
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

      // Parse and filter data - limit to first 100 samples
      const data = rows
        .map((d) => ({
          Length: +d.Length,
          Height: +d.Height,
          Rings: +d.Rings,
          Sex: d.Sex,
        }))
        .filter(
          (d) =>
            !isNaN(d.Length) &&
            !isNaN(d.Height) &&
            !isNaN(d.Rings) &&
            d.Sex &&
            d.Height > 0 &&
            d.Length > 0
        )
        .slice(0, 100); // Take only first 100 samples

      if (data.length === 0) {
        container.append("p").text("No valid data found");
        return;
      }

      // Color scale for gender
      const colorScale = d3
        .scaleOrdinal()
        .domain(["M", "F", "I"])
        .range(["#3498db", "#e74c3c", "#95a5a6"]); // Blue for Male, Red for Female, Gray for Infant

      const genderLabels = {
        M: "Male",
        F: "Female",
        I: "Infant",
      };

      // X scale (Length) with fixed domain from 0.2 to 0.75
      const x = d3.scaleLinear().domain([0.2, 0.75]).range([0, width]);

      // Y scale (Height) with fixed domain from 0.04 to 0.2
      const y = d3.scaleLinear().domain([0.04, 0.2]).range([height, 0]);

      // Size scale for bubbles (Rings)
      const sizeScale = d3
        .scaleSqrt()
        .domain([0, d3.max(data, (d) => d.Rings)])
        .range([2, 15]);

      // Add grid lines
      svg
        .append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).ticks(10).tickSize(-width).tickFormat(""))
        .style("stroke", "#e0e0e0")
        .style("stroke-opacity", 0.3)
        .style("stroke-dasharray", "2,2");

      svg
        .append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(10).tickSize(-height).tickFormat(""))
        .style("stroke", "#e0e0e0")
        .style("stroke-opacity", 0.3)
        .style("stroke-dasharray", "2,2");

      // Create tooltip
      const tooltip = container
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.85)")
        .style("color", "white")
        .style("padding", "10px 14px")
        .style("border-radius", "6px")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-family", "Arial, sans-serif")
        .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");

      // Draw bubbles
      svg
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => x(d.Length))
        .attr("cy", (d) => y(d.Height))
        .attr("r", (d) => sizeScale(d.Rings))
        .attr("fill", (d) => colorScale(d.Sex))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.7)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("opacity", 1).attr("stroke-width", 2.5);
          tooltip
            .style("opacity", 1)
            .html(
              `<strong>Gender:</strong> ${genderLabels[d.Sex]}<br/>
               <strong>Length:</strong> ${d.Length.toFixed(3)}<br/>
               <strong>Height:</strong> ${d.Height.toFixed(3)}<br/>
               <strong>Rings:</strong> ${d.Rings}`
            )
            .style("left", event.pageX + 15 + "px")
            .style("top", event.pageY - 10 + "px");
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", event.pageX + 15 + "px")
            .style("top", event.pageY - 10 + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", 0.7).attr("stroke-width", 1.5);
          tooltip.style("opacity", 0);
        });

      // X axis with custom tick values
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75]))
        .style("font-family", "Arial, sans-serif")
        .selectAll("text")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .style("fill", "#2c3e50");

      // Y axis with custom tick values
      svg
        .append("g")
        .call(d3.axisLeft(y).tickValues([0.04, 0.08, 0.12, 0.16, 0.2]))
        .style("font-family", "Arial, sans-serif")
        .selectAll("text")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .style("fill", "#2c3e50");

      // X axis label
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + 55)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .style("fill", "#2c3e50")
        .style("font-family", "Arial, sans-serif")
        .text("Length");

      // Y axis label
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -55)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .style("fill", "#2c3e50")
        .style("font-family", "Arial, sans-serif")
        .text("Height");

      // Title
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
        .text("Abalone Bubble Plot: Length vs Height (by Gender)");

      // Legend
      const legend = svg
        .append("g")
        .attr("transform", `translate(${width + 20}, 20)`);

      // Legend background
      legend
        .append("rect")
        .attr("x", -10)
        .attr("y", -10)
        .attr("width", 115)
        .attr("height", 280)
        .attr("fill", "white")
        .attr("opacity", 0.9)
        .attr("rx", 6)
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1.5);

      // Legend title
      legend
        .append("text")
        .attr("x", 0)
        .attr("y", 5)
        .style("font-size", "14px")
        .style("font-weight", "600")
        .style("fill", "#2c3e50")
        .text("Gender");

      // Gender legend items
      const genders = ["M", "F", "I"];
      genders.forEach((sex, i) => {
        const yPos = 30 + i * 30;
        legend
          .append("circle")
          .attr("cx", 8)
          .attr("cy", yPos)
          .attr("r", 8)
          .attr("fill", colorScale(sex))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.7);

        legend
          .append("text")
          .attr("x", 25)
          .attr("y", yPos + 5)
          .style("font-size", "12px")
          .style("font-weight", "500")
          .style("fill", "#2c3e50")
          .text(genderLabels[sex]);
      });

      // Size legend (Rings)
      legend
        .append("text")
        .attr("x", 0)
        .attr("y", 120)
        .style("font-size", "14px")
        .style("font-weight", "600")
        .style("fill", "#2c3e50")
        .text("Rings (Size)");

      // Add size examples
      const ringExamples = [5, 10, 15, 20];
      ringExamples.forEach((rings, i) => {
        const yPos = 145 + i * 35;
        legend
          .append("circle")
          .attr("cx", 8)
          .attr("cy", yPos)
          .attr("r", sizeScale(rings))
          .attr("fill", "#95a5a6")
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.7);

        legend
          .append("text")
          .attr("x", 30)
          .attr("y", yPos + 5)
          .style("font-size", "11px")
          .style("font-weight", "500")
          .style("fill", "#2c3e50")
          .text(`${rings} rings`);
      });

      // Info text
      container
        .append("p")
        .style("text-align", "center")
        .style("color", "#555")
        .style("font-size", "14px")
        .style("font-family", "Arial, sans-serif")
        .style("margin-top", "15px")
        .style("padding", "10px")
        .style("background", "rgba(255, 255, 255, 0.7)")
        .style("border-radius", "6px")
        .style("box-shadow", "0 2px 4px rgba(0, 0, 0, 0.1)")
        .html(
          `<em><strong>ℹ️ Info:</strong> Bubble size represents number of rings (age indicator). Hover over bubbles for details. Total: ${data.length} samples.</em>`
        );
    })
    .catch((err) => {
      container.append("p").text("Error loading abalone.csv: " + err.message);
      console.error(err);
    });
};
