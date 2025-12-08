window.onload = function () {
  d3.csv("./dataset/social_media_posts.csv").then((data) => {
    const svg = d3
      .select("#visualization")
      .append("svg")
      .attr("width", 600)
      .attr("height", 400);

    const colors = {
      Instagram: "#E4405F",
      TikTok: "#000000",
      Twitter: "#1DA1F2",
      YouTube: "#FF0000",
    };

    const xScale = d3.scaleLinear().domain([0, 130000]).range([50, 550]);
    const yScale = d3.scaleLinear().domain([10, 40]).range([350, 50]);

    svg
      .append("g")
      .attr("transform", "translate(0,350)")
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".2s")));
    svg
      .append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(yScale).ticks(5));

    svg
      .append("text")
      .attr("x", 300)
      .attr("y", 390)
      .attr("text-anchor", "middle")
      .text("Views");
    svg
      .append("text")
      .attr("x", -200)
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Engagement Rate (%)");

    svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(+d.views))
      .attr("cy", (d) => yScale(+d.engagement_rate))
      .attr("r", "4")
      .style("fill", (d) => colors[d.platform])
      .style("opacity", 0.7)
      .style("stroke", "white")
      .style("stroke-width", 1);

    svg
      .append("text")
      .attr("x", 300)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Social Media Posts: Views vs Engagement Rate");
  });
};
