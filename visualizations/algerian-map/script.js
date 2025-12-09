// Algeria Map Visualization
const width = 1000;
const height = 800;

// Create SVG
const svg = d3
  .select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Create tooltip
const tooltip = d3.select("body").append("div").attr("class", "tooltip");

// Define color scale for different regions
const getRegionColor = (wilayaName) => {
  // Northern wilayas (coastal and Tell region)
  const northern = [
    "Alger",
    "Oran",
    "Annaba",
    "Tlemcen",
    "Mostaganem",
    "Skikda",
    "Jijel",
    "Béjaïa",
    "Tipaza",
    "Boumerdès",
    "Aïn Témouchent",
    "El Tarf",
    "Chlef",
    "Tizi Ouzou",
    "Blida",
  ];

  // Saharan wilayas (desert region)
  const saharan = [
    "Adrar",
    "Tamanghasset",
    "Illizi",
    "Ouargla",
    "Ghardaïa",
    "El Oued",
    "Béchar",
    "Tindouf",
    "Biskra",
  ];

  if (northern.some((name) => wilayaName.includes(name))) {
    return "#3498db"; // Blue for northern
  } else if (saharan.some((name) => wilayaName.includes(name))) {
    return "#f39c12"; // Orange for Sahara
  } else {
    return "#2ecc71"; // Green for high plateaus
  }
};

// Load and display the map
d3.json("../../datasets/algeria.json")
  .then((topology) => {
    // Convert TopoJSON to GeoJSON
    const geojson = topojson.feature(topology, topology.objects.countries);

    // Create a projection
    const projection = d3.geoMercator().fitSize([width, height], geojson);

    // Create a path generator
    const path = d3.geoPath().projection(projection);

    // Draw the wilayas
    svg
      .selectAll(".wilaya")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("class", "wilaya")
      .attr("d", path)
      .attr("fill", (d) => getRegionColor(d.properties.NAME_1))
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        // Highlight the wilaya
        d3.select(this).attr("opacity", 1).raise();

        // Show tooltip
        tooltip
          .classed("show", true)
          .html(
            `
          <strong>${d.properties.NAME_1}</strong><br/>
          <small>Type: ${d.properties.TYPE_1}</small><br/>
          <small>ID: ${d.properties.ID_1}</small>
        `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        // Reset wilaya style
        d3.select(this).attr("opacity", 0.8);

        // Hide tooltip
        tooltip.classed("show", false);
      })
      .on("click", function (event, d) {
        console.log("Clicked on:", d.properties.NAME_1);
      });

    // Add wilaya labels for major cities
    const majorWilayas = [
      "Alger",
      "Oran",
      "Constantine",
      "Annaba",
      "Béjaïa",
      "Sétif",
      "Tlemcen",
      "Ouargla",
      "Adrar",
      "Tamanghasset",
    ];

    svg
      .selectAll(".wilaya-label")
      .data(
        geojson.features.filter((d) =>
          majorWilayas.some((name) => d.properties.NAME_1.includes(name))
        )
      )
      .enter()
      .append("text")
      .attr("class", "wilaya-label")
      .attr("x", (d) => path.centroid(d)[0])
      .attr("y", (d) => path.centroid(d)[1])
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#2c3e50")
      .attr("pointer-events", "none")
      .text((d) => d.properties.NAME_1);

    console.log("Algeria map loaded with", geojson.features.length, "wilayas");
  })
  .catch((error) => {
    console.error("Error loading the map:", error);
    d3.select("#map")
      .append("p")
      .style("color", "red")
      .text("Error loading map data. Please check the algeria.json file path.");
  });
