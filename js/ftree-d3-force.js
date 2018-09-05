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
    .attr('transform', 'translate(' + [window.innerWidth / 2, window.innerHeight / 4] + ')');

console.log("hellooo")

/* ============================ BUILD GRAPH ============================ */

var simulation = 0;
var ftree=0;
var gnodes=0;
var fnodes=0;
var glinks=0;
function buildGraph(graph) {
  graph.nodes = addLinksToNodes(graph.nodes)
  ftree= new fTreeBuilderGedcom(graph,{width:100,height:100},{width:50,height:50})
  graph.nodes = ftree.prettyNodes()
  graph.nodes.forEach(n => n.fy = n.depth*30) // fix their y attribute according to depth
  graph.links = ftree.links
  fnodes = ftree.nodes;
  gnodes = graph.nodes;
  glinks = graph.links;

  simulation = d3.forceSimulation()
    //.alphaDecay(0.005)
    .force("charge", d3.forceManyBody().strength(5))
    .force("centering", d3.forceCenter())
    .force("collision", d3.forceCollide(10))
    .force("link", d3.forceLink().distance(-10).id(d=>d.id))

  simulation.nodes(graph.nodes)
  simulation.force("link").links(graph.links)

  var svgg = svg.append("g")
      .attr("transform","translate("+width/2+","+height/2+")")
      //.attr("transform","translate("+width/2+","+0+")")
  
  var link = svgg.selectAll('.link')
      .data(graph.links)
    .enter().append('line')
      .attr('class', 'link')
      .style('stroke-width', function(d) { return Math.sqrt(d.value); });

  var node = svgg.selectAll('.node')
      .data(graph.nodes)
    .enter().append('g')
      .attr('class', 'node')
      //.call(simulation.drag);

  node.append('circle')
      .attr('r', 5)
      .style('fill', d=> {console.log("depth:"+d.depth+" COLOR: "+color(d.depth));return color(d.depth); });

  node.append('text')
      .text(d => d.id+", "+d.name);

  simulation.on('tick', function() {
    link.attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

    node.attr('transform', d => 'translate(' + [d.x, d.y] + ')');
  });
}

console.log("helloooo")

/* ============================ LOADING DEFAULT GEDCOM ============================ */

gedcome_files = [
  "data/example_gedcom.ged", //ok
  "data/GeorgeWashingtonFamilyBig.ged", // big tree, buggy! interesting
  "data/HouseofHabsburg.ged", // 1 mistake
  "data/KennedyFamily.ged", // wide family tree: many errors, nodes cramped together
  "data/KoranFamilyTree.ged",
  "data/royal92.ged"// too large!
]
var resp = $.get( gedcome_files[0] ,function(data){


  dropHint.remove();
  buildGraph(parseGedcom.d3ize(parseGedcom.parse(data)));
}  );
console.log("hellooooo")