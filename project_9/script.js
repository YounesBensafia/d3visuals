window.onload = function () {
  // Container fallback
  let container = d3.select("#chart");
  if (container.empty()) container = d3.select("#visualization");
  if (container.empty()) container = d3.select("body");

  const width = 960;
  const height = 600;

  // Create SVG
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("font-family", "Arial, sans-serif");

  // Tooltip
  const tooltip = container
    .append("div")
    .attr("class", "treemap-tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "#fff")
    .style("padding", "8px 10px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("opacity", 0);

  // Generic grouping keys (order matters). Default: roast -> loc_country
  const groupKeys = ["roast", "loc_country"];
  // colorScale declared in outer scope so renderNode can reference it before assignment
  let colorScale;

  // Helper: safe accessor for a key, maps null/empty to 'Unknown'
  const accessorFor = (key) => (d) => {
    let v = d[key];
    if (v === null || v === undefined) return "Unknown";
    v = String(v).trim();
    return v === "" ? "Unknown" : v;
  };

  // Convert a nested d3.group (Map) into {name, children[]} structure recursively
  function groupMapToChildren(map) {
    const children = [];
    if (map instanceof Map) {
      for (const [k, v] of map) {
        if (v instanceof Map) {
          children.push({ name: k, children: groupMapToChildren(v) });
        } else if (Array.isArray(v)) {
          // leaf array -> count
          children.push({ name: k, value: v.length });
        } else {
          // unexpected leaf
          children.push({ name: k, value: v });
        }
      }
    }
    return children;
  }

  // Build hierarchy data from rows and groupKeys (generic)
  function buildHierarchy(rows, keys) {
    const accessors = keys.map((k) => accessorFor(k));
    const grouped = d3.group(rows, ...accessors);
    const root = { name: "root", children: groupMapToChildren(grouped) };
    return root;
  }

  // Recursive renderer for treemap nodes
  function renderNode(node, parentG) {
    const g = parentG
      .append("g")
      .attr("class", "node")
      .attr("transform", `translate(${node.x0},${node.y0})`);

    const w = Math.max(0, node.x1 - node.x0);
    const h = Math.max(0, node.y1 - node.y0);

    const rect = g
      .append("rect")
      .attr("width", w)
      .attr("height", h)
      .attr("fill", () => {
        // color by top-level ancestor (roast)
        let ancestor = node;
        while (ancestor.parent && ancestor.depth > 1)
          ancestor = ancestor.parent;
        const key = ancestor.depth === 1 ? ancestor.data.name : node.data.name;
        return colorScale(ancestor.data.name || key);
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
        tooltip.style("opacity", 1);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
        tooltip.style("opacity", 0);
      })
      .on("mouseenter", function (event, d) {
        // set tooltip content on enter using node data
        const nodeData = node.data;
        const value = node.value || 0;
        const path = node
          .ancestors()
          .reverse()
          .map((n) => n.data.name)
          .slice(1)
          .join(" → ");
        tooltip
          .html(
            `<strong>${nodeData.name}</strong><br/>path: ${path}<br/>value: ${value}`
          )
          .style("opacity", 1);
      });

    // Label if large enough
    if (w > 60 && h > 18) {
      g.append("text")
        .attr("x", 4)
        .attr("y", 14)
        .style("font-size", "11px")
        .style("fill", "#0b2533")
        .text(() => {
          return node.data.name + (node.value ? ` (${node.value})` : "");
        });
    }

    // Recurse for children
    if (node.children) {
      node.children.forEach((child) => renderNode(child, parentG));
    }
  }

  // Load CSV and build treemap
  d3.csv("../data/coffee_analysis.csv")
    .then((rows) => {
      // Clean rows minimally
      rows.forEach((d) => {
        // ensure keys exist
        groupKeys.forEach((k) => {
          if (d[k] === undefined || d[k] === null || String(d[k]).trim() === "")
            d[k] = "Unknown";
          else d[k] = String(d[k]).trim();
        });
      });

      const hierarchyData = buildHierarchy(rows, groupKeys);

      const root = d3
        .hierarchy(hierarchyData)
        .sum((d) => (d.value ? d.value : 0))
        .sort((a, b) => b.value - a.value);

      d3.treemap().size([width, height]).paddingInner(2)(root);

      // color scale based on top-level groups
      const topNames = root.children
        ? root.children.map((d) => d.data.name)
        : ["Unknown"];
      // assign colorScale (outer-scoped)
      colorScale = d3.scaleOrdinal().domain(topNames).range(d3.schemeTableau10);

      // Render recursively starting from root (skip root itself)
      root.children && root.children.forEach((child) => renderNode(child, svg));

      // Title
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "700")
    })
    .catch((err) => {
      container
        .append("p")
        .text("Error loading coffee_analysis.csv: " + err.message);
      console.error(err);
    });
};
