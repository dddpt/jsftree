/*var d3 = require('d3'),
    parse = require('../');*/

console.log("hello")
var width = window.innerWidth,
    height = window.innerHeight;

var color = d3.scaleOrdinal(d3.schemeCategory10);

/* ============================ GEDCOM DROPZONE ============================ */
function over() {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    d3.event.dataTransfer.dropEffect = 'copy';
}
console.log("helloo")

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('dropzone', 'copy')
    .on('drop', function(e) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        var f = d3.event.dataTransfer.files[0],
            reader = new FileReader();

        reader.onload = function(e) {
            dropHint.remove();
            buildGraph(parseGedcom.d3ize(parseGedcom.parse(e.target.result)));
        };

        reader.readAsText(f);
    })
    .on('dragenter', over)
    .on('dragexit', over)
    .on('dragover', over);

var dropHint = svg.append('text')
    .text('Drop a GEDCOM file here')
    .attr('class', 'hint')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(' + [window.innerWidth / 2, window.innerHeight / 2] + ')');

console.log("hellooo")

/* ============================ BUILD GRAPH ============================ */

var simulation = 0;
function buildGraph(graph) {
  simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(-20))
    .force("link", d3.forceLink().distance(20))

  simulation.nodes(graph.nodes)
  simulation.force("link").links(graph.links)

  var svgg = svg.append("g")
      .attr("transform","translate("+width/2+","+height/2+")")
  
  var link = svgg.selectAll('.link')
      .data(graph.links)
    .enter().append('line')
      .attr('class', 'link')
      .style('stroke-width', function(d) { return Math.sqrt(d.value); });

  /*function lastName(n) {
      var parts =  n.split(/\s/);
      return n[n.length - 1];
  }*/

  var node = svgg.selectAll('.node')
      .data(graph.nodes)
    .enter().append('g')
      .attr('class', 'node')
      //.call(simulation.drag);

  node.append('circle')
      .attr('r', 5)
      .style('fill', d=> "blue");//return color(lastName(d.famc)); });

  node.append('text')
      .text(d => d.id);

  simulation.on('tick', function() {
    link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

    node.attr('transform', function(d) {
        return 'translate(' + [d.x, d.y] + ')'; });
  });
}

console.log("helloooo")

/* ============================ LOADING DEFAULT GEDCOM ============================ */


var resp = $.get( "./example_gedcom.ged" ,function(data){


  dropHint.remove();
  buildGraph(parseGedcom.d3ize(parseGedcom.parse(data)));
}  );
console.log("hellooooo")