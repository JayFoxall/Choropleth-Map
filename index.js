const w = "80vw";
const h = "100vh";
const padding = {
  left: 100,
  top: 20,
  right: 0,
  bottom: 0,
};
const legendWidth = 350;
const legendHeight = 100;
const colourCount = 8;

function getBachelorsOrHigherFromFips(area, educationData) {
  if (area.id) {
    let educationArea = educationData.filter((d) => d.fips === area.id);
    if (educationArea[0].bachelorsOrHigher) {
      return educationArea[0].bachelorsOrHigher;
    } else return 0;
  }
}

function equidistantArray(min, max, increment) {
  let arr = [];
  for (let i = min; i < max; i += increment) {
    arr.push(i);
  }
  return arr;
}

const DisplayGraph = () => {
  document.addEventListener("DOMContentLoaded", () => {
    const usEducationLink =
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
    const usCountyLink =
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

    //fetch data
    Promise.all([fetch(usEducationLink), fetch(usCountyLink)])
      .then((response) => Promise.all(response.map((r) => r.json())))
      .then((data) => {
        const usEducationData = data[0];
        const usCountyData = data[1];
        let eduRates = usEducationData.map((data) => data.bachelorsOrHigher);
        let minEdu = d3.min(eduRates);
        let maxEdu = d3.max(eduRates);

        //define map title
        let mapTitle = "US Map";
        let mapDescription = "map to show % of 25+ grads in a given state";
        const title = d3
          .select(".title")
          .append("h1")
          .text(mapTitle)
          .append("h6")
          .text(mapDescription)
          .attr("id", "description");

        //define canvas area
        const svg = d3
          .select(".graph")
          .append("svg")
          .attr("width", w)
          .attr("height", h)
          .attr(
            "transform",
            "translate(" + padding.left + "," + padding.top + ")"
          );

        // const colourScale = d3
        //   .scaleLinear()
        //   .domain([0, 100])
        //   .range(["white", "blue"]);

        // const colourScale = d3
        //   .scaleLinear()
        //   .domain([0, 100])
        //   .range(d3.schemeBlues[9]);

        //create colour thresholds
        let colour = d3
          .scaleThreshold()
          .domain(d3.range(minEdu, maxEdu, (maxEdu - minEdu) / colourCount))
          .range(d3.schemeBlues[9]);

        //make legend
        let legendScale = d3
          .scaleLinear()
          .domain([minEdu, maxEdu])
          .range([padding.left, legendWidth]);

        let colourAxis = d3.axisBottom(legendScale).tickValues(colour.domain());

        const legend = d3
          .select(".graph")
          .append("svg")
          .attr("id", "legend")
          .attr("width", legendWidth)
          .attr("height", legendHeight);

        legend
          .append("g")
          .attr("transform", "translate(" + 0 + "," + 10 + ")")
          .attr("id", "legend-axis")
          .call(colourAxis);

        legend
          .append("g")
          .selectAll("rect")
          .data(equidistantArray(minEdu, maxEdu, (maxEdu - minEdu) / 8))
          .enter()
          .append("rect")
          .attr("y", 0)
          .attr("x", (d) => legendScale(d))
          .attr("height", 10)
          .attr("width", legendWidth / colourCount)
          .attr("fill", (d) => colour(d));

        //define tooltip
        let tooltip = d3
          .select(".graph")
          .append("div")
          .attr("id", "tooltip")
          .style("opacity", 0)
          .style("position", "absolute");

        //draw map on screen with tooltip
        let geoGenerator = d3.geoPath();
        svg
          .selectAll("path")
          .data(
            topojson.feature(usCountyData, usCountyData.objects.counties)
              .features
          )
          .enter()
          .append("path")
          .attr("d", (d) => geoGenerator(d))
          .attr("fill", (d) =>
            colour(getBachelorsOrHigherFromFips(d, usEducationData))
          )
          .attr("class", "county")
          .attr("data-fips", (d) => d.id)
          .attr("data-education", (d) =>
            getBachelorsOrHigherFromFips(d, usEducationData)
          )
          .on("mouseover", (event, d) => {
            let coordinates = d3.pointer(event);
            let coordinateY = coordinates[1];
            let coordinateX = coordinates[0];
            let educationArea = usEducationData.filter(
              (area) => area.fips === d.id
            );

            let educationData = getBachelorsOrHigherFromFips(
              d,
              usEducationData
            );

            tooltip
              .style("opacity", 0.6)
              .style("background-color", "white")
              .html(
                `state: ${educationArea[0].state}, area: ${educationArea[0].area_name}, bachelors or higher: ${educationArea[0].bachelorsOrHigher}%`
              )
              .style("left", coordinateX + "px")
              .style("top", coordinateY + 150 + "px")
              .attr("data-education", educationData);
            // .style('left', event.pageX + 20 + 'px')
            // .style('top', event.pageY - 30 + 'px')
          })
          .on("mouseout", (event, d) => {
            tooltip.style("opacity", 0);
          });
      });
  });
};
