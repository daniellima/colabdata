/* global angular */
var component = GraphViewerComponent = function(){}

component.definition = {
    controller: component,
    templateUrl: "static/js/components/graphViewer.html",
    bindings: {
        nodes: '<',
        edges: '<'
    }
}

component.prototype = {
    drawSigma: function(){
        var graphContainer = document.getElementById('graph-container');
        graphContainer.innerHTML = "oie";
        
        // Let's first initialize sigma:
        var s = new sigma('graph-container');
    
        // Then, let's add some data to display:
        s.graph.addNode({
          // Main attributes:
          id: 'n0',
          label: 'Hello',
          // Display attributes:
          // x: 0,
          // y: 0,
          size: 1,
          color: '#f00'
        }).addNode({
          // Main attributes:
          id: 'n1',
          label: 'World !',
          // Display attributes:
          // x: 1,
          // y: 1,
          size: 1,
          color: '#00f'
        }).addEdge({
          id: 'e0',
          // Reference extremities:
          source: 'n0',
          target: 'n1'
        });
        s.startForceAtlas2({});
        // Finally, let's ask our sigma instance to refresh:
        s.refresh();
    },
    
    buildForD3: function(){
      var nodes = [];
      for (var i = 0; i < this.nodes.length; i++) {
        var block = this.nodes[i];
        nodes.push({
          name: block.object.name
        });
      }
      var links = [];
      for (var i = 0; i < this.edges.length; i++) {
        var relation = this.edges[i];
        links.push({
          source: this.nodes.indexOf(relation.blocks[0]),
          target: this.nodes.indexOf(relation.blocks[1])
        });
      }
      
      return {'nodes': nodes, 'links': links};
    },
    
    draw: function(){
      var d3Info = this.buildForD3();
      
      var width = 960,
          height = 500;
      
      var color = d3.scale.category20();
      
      var force = d3.layout.force()
          .charge(-400)
          .linkDistance(100)
          .size([width, height]);
      
      var svg = d3.select("#graph-container");
      // .append("svg")
      //     .attr("width", width)
      //     .attr("height", height);
      
      force
          .nodes(d3Info.nodes)
          .links(d3Info.links)
          .start();
    
      var link = svg.selectAll(".link")
          .data(d3Info.links)
        .enter().append("line")
          .attr("class", "link")
          .style("stroke-width", function(d) { return 1; });
    
      var node = svg.selectAll(".node")
          .data(d3Info.nodes)
        .enter()
          .append('g')
          .attr("class", "node");
          
      node.append("title")
          .text(function(d) { return d.name; });
      
      node.append("circle")
        .attr("r", 30)
        .style("fill", function(d) { return color(4); });
        
      node.append('text')
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr('fill', 'black')
        .text(function(d) { return d.name; });
    
      force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        // node.attr("cx", function(d) { return d.x; })
        //     .attr("cy", function(d) { return d.y; });
      });
    }
};