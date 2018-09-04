
var gnodes=0
class fTreeBuilderGedcom{
  constructor(data, nodeSize, nodeSeparation){
    /*
    data should be an object with keys "nodes" and "links" as returned by addLinksToNodes() after parseGedcom.d3ize() a gedcom file
    */

    this.nodeSize = nodeSize  // object with width and height value
    this.nodeSeparation = nodeSeparation // object with width and height value
    this.nodes= data.nodes.reduce((dic,node) => {dic[node.id] = node; return dic},{}) // transform data.nodes array into dictionnary
    this.links=data.links.map(l => {return {source: data.nodes[l.source].id, target: data.nodes[l.target].id   }}) // change from nodes index to nodes id
    this.width = 0 // maximum width needed among the row

    // add nodeSize to nodes and names to family nodes
    this.nodes = _.mapValues(this.nodes,n=>{
      //n.hidden = n.tag==="FAM"
      n.nodeSize = n.tag==="FAM"? {width:10,height:10} : nodeSize;
      if(n.tag==="FAM"){
        n.name+= " "+(n.husb? this.nodes[n.husb].name:"")+","+(n.wife?this.nodes[n.wife].name:"")
      }
      return n
    })

    // assume that all non-connected nodes start at depth 0
    // and set nodeSize to given nodesize for nodes and {0,0} for family nodes
    this.nodes = this._computeDepth(this.nodes)
    console.log("this.nodes 2.1")
    console.log(this.nodes)
    this.nodes = this._reorderNodesDepthFirst(this.nodes)
    this.nodes = this._computeLayout(this.nodes,nodeSize,nodeSeparation)
    console.log("this.nodes 3")
    console.log(this.nodes)
    gnodes = this.nodes
  }

  _computeDepth(nodes){

    function _propagateDepth(node,depth){
      if(!node){return;}
      console.log("_propagateDepth! "+node.id+" at depth "+depth)
      if(node.depth!=undefined){
        if(node.depth!=depth){
          throw "DepthError: "+node.id+" resolves to 2 different depths: "+node.depth+" and "+depth;
        }
        return;
      }
      node.depth=depth
      _propagateDepth(nodes[node.husb],depth)
      _propagateDepth(nodes[node.wife],depth)
      _propagateDepth(nodes[node.famc],depth-1)
      if(node.fams){
        node.fams.map(fam => _propagateDepth(nodes[fam],depth))
      }
      if(node.chil){
        node.chil.map(chil => _propagateDepth(nodes[chil],depth+1))
      }
      return;
    }

    _.forEach(nodes, n=>{
      if(!n.depth){
        _propagateDepth(n,0)
      }
    })

    //ensure non-negative depths
    let minDepth = d3.min(_.map(nodes,n => n.depth))
    nodes = _.mapValues(nodes, n=> {n.depth-=minDepth;return n})

    return nodes;
  }

  _reorderNodesDepthFirst(nodes){
    let nodes2 = {}
    let root = _.find(nodes,n=>n.depth==0)
    _depthFirstOrder(root)

    function _depthFirstOrder(node){
      if(!node){return;}
      if(nodes2[node.id]){return;}
      console.log("_depthFirstOrder! "+node.id+" at depth "+node.depth)

      _depthFirstOrder(nodes[node.wife])
      nodes2[node.id] = node

      if(node.fams){
        node.fams.map(fam => _depthFirstOrder(nodes[fam]))
      }
      _depthFirstOrder(nodes[node.husb])
      _depthFirstOrder(nodes[node.famc])
      if(node.chil){
        node.chil.map(chil => _depthFirstOrder(nodes[chil]))
      }

      return;
    }

    return nodes2;
  }

  _computeLayout(nodes,nodeSize,nodeSeparation){
    //let elementsPerRow = _.countBy(this.depths)
    //let rowWidth = elementsPerRow * (this.nodeSize.width + this.nodeSeparation.width) - this.nodeSeparation.width
    let nodesPerRow = _.groupBy(nodes, n => n.depth)
    //let rowsWidths = Object.keys(nodesPerRow).map(r => _.sumBy(nodesPerRow[r],v=>v.nodeSize.width+this.nodeSeparation.width))
    let rowsWidths = _.map(nodesPerRow,r => _.sumBy(r,v=>v.nodeSize.width+nodeSeparation.width))
    rowsWidths = rowsWidths.map(rw=>rw-nodeSeparation.width) // delete last useless separation
    this.width = _.max(rowsWidths)
    console.log("nodesPerRow:")
    console.log(nodesPerRow)
    console.log("rowsWidths:")
    console.log(rowsWidths)
    console.log("this.width "+this.width)
    _.map(nodesPerRow,(row,depth) => {
      console.log("ROW "+depth)
      let xpos = (this.width-rowsWidths[depth])/2
      let ypos = depth*(nodeSize.height+nodeSeparation.height) + nodeSize.height/2
      for(let i in row){
        console.log("id: "+row[i].id+", xpos: "+xpos+", ypos: "+ypos)
        xpos += row[i].nodeSize.width/2
        row[i].y = ypos
        row[i].x = xpos
        xpos += row[i].nodeSize.width/2 + nodeSeparation.width
      }
      console.log("=====")
    })

    return nodes;
  }

  getNodeById(id){
    this.nodes.filter(n=>n.id===id)[0]
  }

  prettyNodes(){
    return _.map(this.nodes, n=>n)
  }

  prettyLinks(){
    let toidxy = node => {
      return {
        id:node.id,
        x:node.x,
        y:node.y
      }
    }

    return this.links.map(l=>{
      return {
        source:toidxy(this.nodes[l.source]),
        target:toidxy(this.nodes[l.target])
      }
    })
  }
}

const d3ftreeGedCom={
  init: function(data){
    return(new fTreeBuilderGedcom(data))

  },
}

/*

tasks:
- d3ize gedcom
- add depth information
- compute layout of nodes + links
- draw nodes + links

Algorithm with parse-gedcom:
- d3ize gedcom input in d3ized_ged
- compute famc, fams, etc for each node in d3ized_ged
- calculating depth:
  - set first node depth to 0
  - set famc/fams/husb/wife/chil nodes to given depth
*/