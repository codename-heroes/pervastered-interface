
// Initial variables about font sizes, and dimensions of the diagram
var fontSize = 12
var lineSpace = 2
var boxHeight = 55
var boxWidth = 85
var circleRadius = 10
var width = 400
var height = 290
var yscale_performancebar = d3.scale.linear()
    .domain([0,1])
    .rangeRound([boxHeight/2,-boxHeight/2])

var cluster = d3.layout.cluster()
    .size([height, width - 160]);


var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.x, d.y/1.1]; });



// Setting up json data
var jsonFile = "quest3.json";

function LoadQuestVisualization(jsonFile) {
    var svg = d3.select("#quest-visualization").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(28,28)");

    // Load a json file, and perform the following function when it loads
    //d3.json(jsonFile, function(error, root) {
        var nodes = cluster.nodes(jsonFile),
            links = cluster.links(nodes);

        //DATA JOIN: Bind existing objects to new data
        var existingLinks = svg.selectAll(".link")
            .data(links)
        var existingNodes = svg.selectAll(".node")
            .data(nodes)

        //UPDATE: Update old elements (before making new ones)

        //ENTER: Create new objects where necessary
        existingLinks.enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal)

        var newNodes = existingNodes.enter().append("g")
        newNodes
            .attr("class", "node")
            .attr("id", function(d){return d.name})
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y/1.1 + ")"; })
            .attr("href","#profile-groups")
            .append("circle")//.append("rect")
            .attr('class', 'nodebox')
            .attr("cx", 0)//-boxWidth/2)
            .attr("cy", 0)//-boxHeight/2)
            .attr("r",function(d) { if (d.params["players"]) return circleRadius; else return 0;})//.attr("width", function(d) { if (d.params["players"]) return boxWidth; else return 0;})
            //.attr("height", function(d) { if (d.params["players"]) return boxHeight; else return 0;})
            //.attr("rx", boxWidth/20)
            //.attr("ry", boxWidth/20)
            .attr("title", function(d) { return d.params["id"];})

        // Highlight node when we mouse-over
        newNodes.on("mouseover", function() {
            var thisNode = d3.select(this);
            thisNode.select(".nodebox")
                .transition()
                .duration(100)
                .attr("transform", "scale(1.1)")
            thisNode.select(".nodeTitle")
                .transition()
                .duration(100)
                .attr("transform", "scale(1.1)")
            thisNode.select(".nodePlayer")
                .transition()
                .duration(100)
                .attr("transform", "scale(1.1)")
        })
        newNodes.on("mouseout", function(){
            var thisNode = d3.select(this);
            thisNode.select(".nodebox")
                .transition()
                .duration(100)
                .attr("transform", "scale(1)")
            thisNode.select(".nodeTitle")
                .transition()
                .duration(100)
                .attr("transform", "scale(1)")
            thisNode.select(".nodePlayer")
                .transition()
                .duration(100)
                .attr("transform", "scale(1)")
        })
        newNodes.on("click", function(e) {
            var thisNode = d3.select(this);
            $("#myTab li").toggleClass("active", false);
            $("#quest-select-subquest").val(thisNode.attr("id")).change();
            $("#myTab li:first").toggleClass("active");
            $(this).tab("show");
        })

        //Add node titles
        newNodes.append("text")
            .attr("id", "nodetitle")
            .attr("class", "nodeTitle")
            .attr("y", -boxHeight/2 + fontSize + 2*lineSpace)
            .attr("text-anchor", "middle")

        //Add node edge
        newNodes.append("text")
            .attr("id", "nodeEdge")
            .attr("class", "nodeEdge")
            .attr("y", -boxHeight/1.2 + fontSize + 2*lineSpace)
            .attr("x", 5)
            .attr("text-anchor", "start")
            .attr("title", function(d) { return d.params["edge_id"];})
        // Add number of people
        newNodes.append("text")
            .attr("id", "nodePlayer")
            .attr("class", "nodePlayer")
            .attr("y", circleRadius/5)
            .attr("x", 0)
            .attr("text-anchor", "middle")

        //ENTER + UPDATE: Update all nodes with new attributes
        existingLinks
            .transition()
            .duration(1000)
            .style("stroke-width", function(d){return 5E-3*d.target.params.nKPsForThisNode})

        existingNodes.select("#nodetitle")
            .text(function(d){return d.name})
        existingNodes.select("#nodeEdge")
            .text(function(d){return d.params["edge"]})
        existingNodes.select("#nodePlayer")
            .text(function(d){return d.params["players"]})
    //})
}

function getLinkWidthTotal(node) {
    return 5E-3*d.target.params.nKPsForThisNode

}

function getLinkWidthClass(node) {
    return 10;
}

d3.select(self.frameElement).style("height", height + "px");