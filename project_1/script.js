window.onload = function () {
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", 1500)
    .attr("height", 200)
    .style("border", "1px solid black")
    .style("background-color", "red");

  d3.csv("./data/named_colors_css.csv").then((data) => {

    const spacing = 70;
    const startX = 50;

    for (let i = 0; i < data.length; i++) {
      console.log(
        `Creating circle ${i} with color: ${data[i].Name} - ${data[i].Hex}`
      );
      const row = Math.floor(i / 10);
      const col = i % 10;

      svg
        .append("circle")
        .attr("cx", startX + col * spacing)
        .attr("cy", 100 + row * spacing)
        .attr("r", 30)
        .style("fill", data[i].Hex);
    }
  });
};
