// stacked_titanic.js — code robuste
window.onload = function () {
  const margin = { top: 50, right: 40, bottom: 80, left: 80 };
  const outerWidth = 700;
  const outerHeight = 600;
  const width = outerWidth - margin.left - margin.right;
  const height = outerHeight - margin.top - margin.bottom;

  // prefer rendering inside #chart if present
  const container = d3.select("#chart").empty()
    ? d3.select("body")
    : d3.select("#chart");

  const svg = container
    .append("svg")
    .attr("width", outerWidth)
    .attr("height", outerHeight)
    .style("background", "#f7f7f7");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // helper: run local server if you open file:// (see checklist below)
  // data file is located at repo root `dataset/titanic-data.csv`, from project_4 this is ../../datasets//...
  d3.csv("../../datasets//titanic-data.csv")
    .then((raw) => {
      if (!raw || raw.length === 0) {
        console.error(
          "CSV vide ou non chargé. Vérifie le chemin et le serveur."
        );
        return;
      }

      // --- Normalize column names and values ---
      const sexKey = raw.columns.includes("Sex")
        ? "Sex"
        : raw.columns.includes("Gender")
        ? "Gender"
        : null;
      if (!sexKey) {
        console.error(
          "Aucune colonne 'Sex' ou 'Gender' trouvée dans le CSV. colonnes:",
          raw.columns
        );
        return;
      }

      // map utile
      const data = raw.map((d) => ({
        Pclass: d.Pclass,
        sex: (d[sexKey] || "").toString().trim().toLowerCase(), // male / female
      }));

      // --- Grouping: count per Pclass and sex ---
      const grouped = d3.group(
        data,
        (d) => d.Pclass,
        (d) => d.sex
      );
      // build counts array with deterministic Pclass order
      const classes = Array.from(new Set(data.map((d) => d.Pclass))).sort(
        (a, b) => +a - +b
      );

      const counts = classes.map((cls) => {
        const genders = grouped.get(cls) || new Map();
        return {
          Pclass: cls,
          male: (genders.get("male") || []).length,
          female: (genders.get("female") || []).length,
          other: (genders.get("other") || []).length, // in case extra values
        };
      });

      console.log("classes:", classes);
      console.log("counts:", counts);

      // Decide keys to stack: put 'female' first so stacks show femme on bottom if desired
      const keys = ["female", "male"].filter((k) =>
        counts.some((c) => c[k] !== undefined)
      );
      console.log("stack keys:", keys);

      // --- Stack generator ---
      const stackGen = d3.stack().keys(keys);
      const series = stackGen(counts);
      console.log("series (stack output):", series);

      // --- scales ---
      const x = d3.scaleBand().domain(classes).range([0, width]).padding(0.2);

      const y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(counts, (d) => keys.reduce((s, k) => s + (d[k] || 0), 0)),
        ])
        .nice()
        .range([height, 0]);

      const color = d3
        .scaleOrdinal()
        .domain(keys)
        .range(["#ff7f0e", "#1f77b4"]);

      // axes with nicer styling
      const xAxisG = g
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

      // rotate x labels when many classes
      if (classes.length > 3) {
        xAxisG
          .selectAll("text")
          .attr("transform", "rotate(-20)")
          .style("text-anchor", "end")
          .attr("dx", "-0.6em")
          .attr("dy", "0.15em");
      }

      const yAxisG = g.append("g").call(d3.axisLeft(y).ticks(6));

      // Axis labels (French)
      svg
        .append("text")
        .attr("x", margin.left + width / 2)
        .attr("y", outerHeight - 12)
        .attr("text-anchor", "middle")
        .attr("font-size", "13px")
        .text("Pclass");

      svg
        .append("text")
        .attr(
          "transform",
          `translate(14, ${margin.top + height / 2}) rotate(-90)`
        )
        .attr("text-anchor", "middle")
        .attr("font-size", "13px")
        .text("Nombre");

      // horizontal gridlines
      g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(""))
        .selectAll("line")
        .attr("stroke", "#e9e9e9");

      // --- draw stacked bars ---
      const layer = g
        .selectAll(".layer")
        .data(series)
        .enter()
        .append("g")
        .attr("class", "layer")
        .attr("fill", (d) => color(d.key));

      // tooltip (simple div inside container)
      const tooltip = d3
        .select(container.node())
        .append("div")
        .attr("class", "tooltip");

      // compute totals for legend display
      const totals = {};
      keys.forEach((k) => {
        totals[k] = d3.sum(counts, (d) => d[k] || 0);
      });

      // for each series (key) append rects for all classes
      layer
        .selectAll("rect")
        .data((d) => d)
        .enter()
        .append("rect")
        .attr("x", (d, i) => x(classes[i]))
        .attr("y", (d) => y(d[1]))
        .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
        .attr("width", x.bandwidth())
        .attr("stroke", "white");

      // legend (placed inside svg on the right)
      const legend = svg
        .append("g")
        .attr(
          "transform",
          `translate(${margin.left + width - 80}, ${margin.top - 10})`
        );
      const labelMap = { female: "Femme", male: "Homme" };
      keys.forEach((k, i) => {
        const lg = legend
          .append("g")
          .attr("transform", `translate(0, ${i * 20})`);
        lg.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", color(k));
        lg.append("text")
          .attr("x", 16)
          .attr("y", 10)
          .text(`${labelMap[k] || k} (${totals[k] || 0})`)
          .attr("font-size", "12px");
      });

      // title
      svg
        .append("text")
        .attr("x", outerWidth / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Titanic: stacked by sex per Pclass");
    })
    .catch((err) => {
      console.error("Erreur chargement CSV:", err);
    });
};
