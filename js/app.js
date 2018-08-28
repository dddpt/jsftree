
// set the dimensions and margins of the diagram
var margin = {top: 0, right: 0, bottom: 0, left: 0},
width = 1300 - margin.left - margin.right,
height = 1000 - margin.top - margin.bottom;

var transitionsDuration = 500 // duration of transitions in msec

// global variables (mainly used for DEBUGGING)
var ftreeData = 0
var ftree = 0
var nodes = 0
var links = 0
var svgg = 0


function createFamilyTree(svgContainerSelector,ftreeData){
  // append the svg obgect to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select(svgContainerSelector).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  svgg = svg.append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
  

  return updateFamilyTree(ftreeData);
}

function updateFamilyTree(ftreeData, source){
  //good page for collapsible tree: https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd

  ftree = new fTreeBuilder(ftreeData,{width:100,height:100},{width:50,height:50})

  if(!source){
    source = {x:ftree.width/2,y:0}
  }

  // maps the node data to the tree layout
  nodes = ftree.nodes()
  links = ftree.links()


  // adds the links between the nodes
  var link = svgg.selectAll(".link")
    .data( links)
  var linkEnter = link.enter().append("path")
    .attr("class", d => "link "+d.id+"-"+d.target.id)
    .attr("d", "M" + source.x + "," + source.y
        + "C" + source.x + "," + source.y
        + " " + source.x + "," +  source.y
        + " " + source.x + "," + source.y
      )
      .attr("fill","none")
      .attr("stroke","lightgrey")

  var linkUpdate = linkEnter.merge(link)
  linkUpdate.transition()
    .duration(transitionsDuration)
    .attr("d", d=> 
      "M" + d.source.x + "," + d.source.y
        + "C" + d.source.x + "," + (d.source.y + d.target.y) / 2
        + " " + d.target.x + "," +  (d.source.y + d.target.y) / 2
        + " " + d.target.x + "," + d.target.y
      )

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(transitionsDuration)
      .attr("d", d=> "M" + d.target.x + "," + d.target.y
        + "C" + d.target.x + "," + d.target.y
        + " " + d.target.x + "," +  d.target.y
        + " " + d.target.x + "," + d.target.y
      )
      .remove();

  // adds each node as a group
  var node = svgg.selectAll(".node")
    .data(nodes.filter(n=>!n.hidden))
  
  var nodeEnter = node.enter().append("g")
    .attr("id", d => "node-"+d.id )
    .attr("transform", "translate(" + source.x + "," + source.y + ")");
    //.attr("transform", function(d) { 
    //  return "translate(" + d.x + "," + d.y + ")"; });
  
  // adds the circle to the node
  nodeEnter.append("circle")
    .attr("r", d=>d.nodeSize.width/2)
    .attr("fill","lightblue")
    .attr("class", d => "node "+d.class )

  // adds the logo -> doesn't work yet
  nodeEnter.append("foreignObject")
    .attr("x","-50px")
    .attr("y","-50px")
    .attr("width","100px")
    .attr("height","100px")
    .append("div")
    .attr("id",d=> "node-div-"+node.id)
    .attr("style","height:100px;width:100px;border-radius: 100%;")
    .append("i")
    .attr("class",d=>{
      var logo = "fas fa-"
      switch(d.class){
        case "man":
        logo += "mars"
        break;
        case "woman":
        logo += "venus"
        break;
        case "add-node":
        logo += "user-plus"
        break;
        case "add-node":
        default:
        logo += "user"
      }
      return logo+" icon";
    })
  /*node.append("text")
    .attr("x",0)
    .attr("y",0)
    .attr("class","icon")
    .text(d => {switch(d.class){
        case "add-node":
        return("&#xf234;") // fa-user-plus
        default:
        return("&#xf007;") // fa-user icon
      }}
    )*/
  

  // adds the text to the node
  nodeEnter.append("text")
  .attr("dy", ".35em")
  .attr("y", 20)
  .style("text-anchor", "middle")
  .text(function(d) { return d.name; });

  nodeUpdate = nodeEnter.merge(node)
  nodeUpdate.transition()
    .duration(transitionsDuration)
    .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(transitionsDuration)
      .attr("transform", d=> "translate(" + d.links[0].x + "," + d.links[0].y + ")")
      .remove();

}


$.getJSON( "basic_family.json", function( treeData ) {
  ftreeData = treeData

  createFamilyTree("#graph",ftreeData)


});


// DEFAULTSDEEP TEST


source = {
  aa: 11,
  bb: 22,
  cc: {
    ccc: "c"
  },
  dd: 44
}

target = {
  aa: 1,
  bb: 2,
  cc: {
    aaa: "a",
    bbb: "b"
  }
}

result = _.defaultsDeep(target,source)
target==result // true!
// _.defaultsDeep() mutates target objects & returns it as result