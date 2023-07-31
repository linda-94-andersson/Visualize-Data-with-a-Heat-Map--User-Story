import { useEffect, useState } from "react";
import axios from "axios";
import * as d3 from "d3";
import "./App.css";

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch the dataset using Axios
    axios
      .get(
        "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
      )
      .then((response) => {
        setData(response.data);
        createHeatMap(response.data);
      })
      .catch((error) => console.error(error));
  }, []);

  const createHeatMap = (data) => {
    // Constants for the dimensions of the SVG and the margins
    const margin = { top: 80, right: 25, bottom: 30, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Parse the time data
    const parseTime = d3.timeParse("%Y-%m");
    data.monthlyVariance.forEach((d) => {
      d.year = parseTime(d.year + "-" + d.month);
    });

    // Create scales for x and y axes
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data.monthlyVariance, (d) => d.year))
      .range([0, width]);

    const yScale = d3
      .scaleBand()
      .domain(data.monthlyVariance.map((d) => d3.timeFormat("%B")(d.year)))
      .range([0, height]);

    // Create the SVG element and append a group to it
    const svg = d3
      .select("#heatmap")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create the x and y axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y"));
    const yAxis = d3.axisLeft(yScale);

    svg
      .append("g")
      .attr("id", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis);

    svg.append("g").attr("id", "y-axis").call(yAxis);

    // Define a color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create the heat map cells
    svg
      .selectAll(".cell")
      .data(data.monthlyVariance)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", (d) => xScale(d.year))
      .attr("y", (d) => yScale(d3.timeFormat("%B")(d.year)))
      .attr("width", width / (data.monthlyVariance.length / 12))
      .attr("height", height / 12)
      .attr("data-month", (d) => d.month - 1)
      .attr("data-year", (d) => d3.timeFormat("%Y")(d.year))
      .attr("data-temp", (d) => data.baseTemperature + d.variance)
      .attr("fill", (d) => colorScale(d.variance))
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    // Create the legend
    const legendWidth = 300;
    const legendHeight = 20;
    const legendRectWidth = legendWidth / colorScale.domain().length;
    const legend = svg
      .append("g")
      .attr("id", "legend")
      .attr(
        "transform",
        `translate(${width / 2 - legendWidth / 2}, ${height + 40})`
      );

    legend
      .selectAll(".legend-rect")
      .data(colorScale.domain())
      .enter()
      .append("rect")
      .attr("class", "legend-rect")
      .attr("x", (d, i) => i * legendRectWidth)
      .attr("y", 0)
      .attr("width", legendRectWidth)
      .attr("height", legendHeight)
      .attr("fill", (d) => colorScale(d));

    const legendAxis = d3.axisBottom(
      d3.scaleLinear().domain(colorScale.domain()).range([0, legendWidth])
    );
    legend
      .append("g")
      .attr("id", "legend-axis")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
  };

  const handleMouseOver = (event, d) => {
    const tooltip = d3.select("#tooltip");
    tooltip.style("display", "inline");
    tooltip.style("left", event.pageX + 10 + "px");
    tooltip.style("top", event.pageY + 10 + "px");
    tooltip.attr("data-year", d3.timeFormat("%Y")(d.year));
    tooltip.html(
      `${d3.timeFormat("%B %Y")(d.year)}<br/>Temperature: ${(
        data.baseTemperature + d.variance
      ).toFixed(2)}°C<br/>Variance: ${d.variance.toFixed(2)}°C`
    );
  };

  const handleMouseOut = () => {
    d3.select("#tooltip").style("display", "none");
  };

  return (
    <div>
      <h1 id="title">Monthly Global Land-Surface Temperature</h1>
      <p id="description">Base temperature: {data.baseTemperature}°C</p>
      <svg id="heatmap"></svg>
      <div id="tooltip" style={{ display: "none" }}></div>
    </div>
  );
}

export default App;
