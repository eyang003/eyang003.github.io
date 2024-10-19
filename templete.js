d3.csv('iris.csv').then(function(data) {
    // Convert data to numeric type for scatter plot
    data.forEach(d => {
        d.petalLength = +d.petalLength;
        d.petalWidth = +d.petalWidth;
    });

    // Create the scatter plot
    createScatterPlot(data);

    // Create the side-by-side boxplot
    createBoxPlot(data);
});

// Scatter Plot Function
function createScatterPlot(data) {
    // Define dimensions and margins for the SVG
    const margin = {top: 20, right: 30, bottom: 50, left: 60};
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG canvas
    const svg = d3.select("#scatterplot")
                  .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleLinear()
                .domain([d3.min(data, d => d.petalLength), d3.max(data, d => d.petalLength)])
                .range([0, width]);

    const y = d3.scaleLinear()
                .domain([d3.min(data, d => d.petalWidth), d3.max(data, d => d.petalWidth)])
                .range([height, 0]);

    // Set up color scale for species
    const color = d3.scaleOrdinal()
                    .domain(["setosa", "versicolor", "virginica"])
                    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

    // Add axes to the plot
    svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x));

    svg.append("g")
       .call(d3.axisLeft(y));

    // Add circles for each data point
    svg.selectAll("circle")
       .data(data)
       .enter()
       .append("circle")
       .attr("cx", d => x(d.petalLength))
       .attr("cy", d => y(d.petalWidth))
       .attr("r", 5)
       .style("fill", d => color(d.species));

    // Add labels for axes
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", height + margin.bottom - 10)
       .attr("text-anchor", "middle")
       .text("Petal Length");

    svg.append("text")
       .attr("x", -height / 2)
       .attr("y", -margin.left + 20)
       .attr("text-anchor", "middle")
       .attr("transform", "rotate(-90)")
       .text("Petal Width");

    // Add legend
    const species = ["setosa", "versicolor", "virginica"];
    const legend = svg.selectAll(".legend")
                      .data(species)
                      .enter()
                      .append("g")
                      .attr("transform", (d, i) => `translate(${width - 80}, ${i * 20})`);

    // Add colored circles to legend
    legend.append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", 5)
          .style("fill", d => color(d));

    // Add text to legend
    legend.append("text")
          .attr("x", 15)
          .attr("y", 5)
          .text(d => d);
}

// Boxplot Function
function createBoxPlot(data) {
    // Convert to numeric data for boxplot
    data.forEach(d => {
        d.petalLength = +d.petalLength;
    });

    // Define dimensions and margins
    const margin = {top: 20, right: 30, bottom: 50, left: 60};
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG canvas
    const svg = d3.select("#boxplot")
                  .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleBand()
                .domain(["setosa", "versicolor", "virginica"])
                .range([0, width])
                .padding(0.2);

    const y = d3.scaleLinear()
                .domain([d3.min(data, d => d.petalLength), d3.max(data, d => d.petalLength)])
                .range([height, 0]);

    // Add axes
    svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x));

    svg.append("g")
       .call(d3.axisLeft(y));

    // Roll up data by species to calculate quartiles
    const rollupFunction = v => {
        const q1 = d3.quantile(v.map(d => d.petalLength).sort(d3.ascending), 0.25);
        const median = d3.quantile(v.map(d => d.petalLength).sort(d3.ascending), 0.5);
        const q3 = d3.quantile(v.map(d => d.petalLength).sort(d3.ascending), 0.75);
        const iqr = q3 - q1;
        return {q1, median, q3, iqr};
    };

    const quartilesBySpecies = d3.rollup(data, rollupFunction, d => d.species);

    // Draw boxes for each species
    quartilesBySpecies.forEach((quartiles, species) => {
        const xPos = x(species);
        const boxWidth = x.bandwidth();

        // Draw the vertical line (whiskers)
        svg.append("line")
           .attr("x1", xPos + boxWidth / 2)
           .attr("x2", xPos + boxWidth / 2)
           .attr("y1", y(quartiles.q1 - 1.5 * quartiles.iqr))
           .attr("y2", y(quartiles.q3 + 1.5 * quartiles.iqr))
           .attr("stroke", "black");

        // Draw the box
        svg.append("rect")
           .attr("x", xPos)
           .attr("y", y(quartiles.q3))
           .attr("height", y(quartiles.q1) - y(quartiles.q3))
           .attr("width", boxWidth)
           .attr("fill", "#69b3a2");

        // Draw the median line
        svg.append("line")
           .attr("x1", xPos)
           .attr("x2", xPos + boxWidth)
           .attr("y1", y(quartiles.median))
           .attr("y2", y(quartiles.median))
           .attr("stroke", "black");
    });
}