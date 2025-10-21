window.onload = function () {
  const margin = { top: 50, right: 30, bottom: 50, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  d3.csv("../data/random_data.csv").then((raw) => {
    let data = raw
      .map((d, i) => ({ name: String(i + 1), value: +d.x }))
      .filter((d) => !isNaN(d.value));

    let x = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, width])
      .padding(0.2);

    let y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .range([height, 0]);


    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

    // X Axis Label
    svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .style("font-size", "16px")
      .style("fill", "white")
      .text("Index");

    // Y Axis Label
    svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90)`)
      .attr("x", -height / 2)
      .attr("y", -45)
      .style("font-size", "16px")
      .style("fill", "white")
      .text("Value");

    svg
      .selectAll(".bar")
      .data(data, (d) => d.name)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.name))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.value))
      .attr("fill", "skyblue");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("fill", "white")
      .text("Bar Chart from random_data.csv");

    document.getElementById("update-button").onclick = async function () {
      let arr = data.slice();
      let bars = svg.selectAll(".bar");
      let n = arr.length;
      for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
          if (arr[j].value < arr[minIdx].value) {
            minIdx = j;
          }
        }
        if (minIdx !== i) {
          [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
          arr.forEach((d, idx) => (d.name = String(idx + 1)));
          x.domain(arr.map((d) => d.name));
          bars
            .data(arr, (d) => d.name)
            .transition()
            .duration(300)
            .attr("x", (d) => x(d.name));
          await new Promise((resolve) => setTimeout(resolve, 420));
        }
      }
    };
  });
};
