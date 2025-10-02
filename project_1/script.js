window.onload = function () {
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", 1500)
    .attr("height", 200);

  d3.csv("./data/named_colors_css.csv").then((data) => {
    data.forEach((d, index) => {
      // console.log(`${index}: ${d.Name} - ${d.Hex}`);
    });

    const spacing = 70; 
    const startX = 50;
    
    for (let i = 0; i < data.length; i++) {
      console.log(`Creating circle ${i} with color: ${data[i].Name} - ${data[i].Hex}`);
      svg
      .append("circle")
      .attr("cx", startX + (i * spacing))
      .attr("cy", 100)
      .attr("r", 30)
      .style("fill", data[i].Hex);
    }
  });
};
