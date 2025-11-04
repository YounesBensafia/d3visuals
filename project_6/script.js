window.onload = function () {
  let container = d3.select("#chart2");
  if (container.empty()) container = d3.select("#visualization");
  if (container.empty()) container = d3.select("body");
  const W = 900,
    H = 450;
  const margin = { top: 40, right: 30, bottom: 60, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const svg = container
    .append("svg")
    .attr("width", W)
    .attr("height", H)
    .style("background", "#fafafa")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  function K(t) {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * t * t);
  }

  const h = 3; 
  const sampleLimit = 892;

  d3.csv("../data/titanic-data.csv", (d) => ({
    Age: d.Age === "" || d.Age === undefined ? null : +d.Age,
    Gender: d.Gender ?? d.Sex,
  }))
    .then((rows) => {
      const maleAgesAll = rows
        .filter((r) => r.Gender === "male" && !isNaN(r.Age))
        .map((r) => r.Age);
      const femaleAgesAll = rows
        .filter((r) => r.Gender === "female" && !isNaN(r.Age))
        .map((r) => r.Age);

      const maleXi = maleAgesAll.slice(0, sampleLimit);
      const femaleXi = femaleAgesAll.slice(0, sampleLimit);

      const nMale = maleXi.length;
      const nFemale = femaleXi.length;

      if (nMale === 0 && nFemale === 0) {
        container.append("p").text("No age data available.");
        return;
      }

      const allAges = rows
        .map((r) => r.Age)
        .filter((a) => a !== null && !isNaN(a));
      const minAge = Math.floor(d3.min(allAges));
      const maxAge = Math.ceil(d3.max(allAges));
      const step = 0.1;
      const xj = d3.range(minAge, maxAge + step, step);

      function computeKDE(xi_data) {
        const n = xi_data.length;
        if (n === 0) return xj.map((x) => 0);

        const inv_nh = 1 / (n * h);
        const densities = xj.map((xj_val) => {
          let sum = 0;
          for (let i = 0; i < n; i++) {
            const t = (xj_val - xi_data[i]) / h;
            sum += K(t);
          }
          return inv_nh * sum;
        });
        return densities;
      }

      const maleDensity = computeKDE(maleXi);
      const femaleDensity = computeKDE(femaleXi);

      const x = d3
        .scaleLinear()
        .domain([Math.max(0, minAge - 2), maxAge + 2])
        .range([0, innerW])
        .nice();

      const y = d3.scaleLinear().domain([0, 0.04]).range([innerH, 0]);

      svg
        .append("g")
        .attr("transform", `translate(0, ${innerH})`)
        .call(d3.axisBottom(x).ticks(10))
        .selectAll("text")
        .style("font-size", "11px");

      svg
        .append("g")
        .call(d3.axisLeft(y).ticks(8))
        .selectAll("text")
        .style("font-size", "11px");

      svg
        .append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH + 45)
        .attr("text-anchor", "middle")
        .text("Âge (ans)")
        .style("font-size", "20px")
        .style("font-weight", "bold");

      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -55)
        .attr("text-anchor", "middle")
        .text("Densité estimée")
        .style("font-size", "20px")
        .style("font-weight", "bold");

      function drawLineForDensity(densityArray) {
        let pathData = "";
        for (let idx = 0; idx < xj.length; idx++) {
          const xVal = x(xj[idx]);
          const yVal = y(densityArray[idx]);
          if (idx === 0) {
            pathData += `M ${xVal} ${yVal}`;
          } else {
            pathData += ` L ${xVal} ${yVal}`;
          }
        }
        return pathData;
      }

      const malePath = drawLineForDensity(maleDensity);
      svg
        .append("path")
        .attr("d", malePath)
        .attr("stroke", "#2E86AB")
        .attr("stroke-width", 2.5)
        .attr("fill", "none");

      let maleAreaPath = "";
      for (let idx = 0; idx < xj.length; idx++) {
        const xVal = x(xj[idx]);
        const yVal = y(maleDensity[idx]);
        if (idx === 0) {
          maleAreaPath += `M ${xVal} ${yVal}`;
        } else {
          maleAreaPath += ` L ${xVal} ${yVal}`;
        }
      }
      for (let idx = xj.length - 1; idx >= 0; idx--) {
        const xVal = x(xj[idx]);
        maleAreaPath += ` L ${xVal} ${y(0)}`;
      }
      maleAreaPath += " Z";
      svg
        .append("path")
        .attr("d", maleAreaPath)
        .attr("fill", "#2E86AB")
        .attr("fill-opacity", 0.3);

      const femalePath = drawLineForDensity(femaleDensity);
      svg
        .append("path")
        .attr("d", femalePath)
        .attr("stroke", "#F29E4C")
        .attr("stroke-width", 2.5)
        .attr("fill", "none");

      let femaleAreaPath = "";
      for (let idx = 0; idx < xj.length; idx++) {
        const xVal = x(xj[idx]);
        const yVal = y(femaleDensity[idx]);
        if (idx === 0) {
          femaleAreaPath += `M ${xVal} ${yVal}`;
        } else {
          femaleAreaPath += ` L ${xVal} ${yVal}`;
        }
      }
      for (let idx = xj.length - 1; idx >= 0; idx--) {
        const xVal = x(xj[idx]);
        femaleAreaPath += ` L ${xVal} ${y(0)}`;
      }
      femaleAreaPath += " Z";
      svg
        .append("path")
        .attr("d", femaleAreaPath)
        .attr("fill", "#ff1100ff")
        .attr("fill-opacity", 0.3);

      svg
        .append("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", y(0))
        .attr("y2", y(0))
        .attr("stroke", "#999")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");

      const legend = svg
        .append("g")
        .attr("transform", `translate(${innerW - 200}, -25)`);

      legend
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("fill", "#2E86AB");
      legend
        .append("text")
        .attr("x", 12)
        .attr("y", 4)
        .text(`Male`)
        .style("font-size", "15px");

      legend
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 20)
        .attr("r", 5)
        .attr("fill", "#F29E4C");
      legend
        .append("text")
        .attr("x", 12)
        .attr("y", 24)
        .text(`Female`)
        .style("font-size", "15px");
    })
    .catch((err) => {
      container
        .append("p")
        .text("Erreur chargement CSV: " + err.message)
        .style("color", "red");
    });
};
