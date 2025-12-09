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

// Define colors for four regions
const colors = {
  NW: "#E8B4A8", // North West - Light pink/salmon
  NE: "#A8D5BA", // North East - Light green/mint
  SW: "#D4B4D8", // South West - Light purple
  SE: "#7BA3C7", // South East - Blue
};

// Define color scale for different regions
const getRegionColor = (wilayaName) => {
  // North West
  const NW = [
    "Tlemcen",
    "Aïn Témouchent",
    "Oran",
    "Mostaganem",
    "Chlef",
    "Relizane",
    "Mascara",
    "Sidi Bel Abbès",
    "Saïda",
    "Naâma",
    "Tiaret",
    "Tissemsilt",
    "Aïn Defla",
    "Tipaza",
    "Blida",
    "Alger",
    "Boumerdès",
  ];

  // North East
  const NE = [
    "Tizi Ouzou",
    "Bouira",
    "Médéa",
    "Béjaïa",
    "Bordj Bou Arréridj",
    "Sétif",
    "Jijel",
    "Mila",
    "Constantine",
    "Skikda",
    "Guelma",
    "Annaba",
    "El Tarf",
    "Souk Ahras",
    "Oum el Bouaghi",
    "Batna",
    "Khenchela",
    "Tébessa",
    "M'Sila",
  ];

  // South West
  const SW = [
    "El Bayadh",
    "Béchar",
    "Tindouf",
    "Adrar",
    "Djelfa",
    "Laghouat",
    "Ghardaïa",
    "Tamanghasset",
  ];

  // South East
  const SE = ["Biskra", "El Oued", "Ouargla", "Illizi"];

  if (NW.some((name) => wilayaName.includes(name))) {
    return colors.NW;
  } else if (NE.some((name) => wilayaName.includes(name))) {
    return colors.NE;
  } else if (SW.some((name) => wilayaName.includes(name))) {
    return colors.SW;
  } else if (SE.some((name) => wilayaName.includes(name))) {
    return colors.SE;
  } else {
    return "#CCCCCC"; // Default gray
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
