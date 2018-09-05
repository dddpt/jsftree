
var gnodes=0
class fTreeBuilderGedcom{
  constructor(data, nodeSize, nodeSeparation,centerNodeId){
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
    //this.nodes = this._reorderNodesDepthFirst(this.nodes)
    //this.nodes = this._computeLayout(this.nodes,nodeSize,nodeSeparation)
    this.nodes = computeNodesInitialPositions(this.nodes,centerNodeId)
    
    gnodes = this.nodes
  }

  /*
  Computes depth of all the nodes in the family tree
  Also computes max- and min-deph reachable from node relative to centerNode
  adds following properties to each node:
  - depth
  - minDepth
  - maxDepth
  */
  _computeDepth(nodes,centerNodeId=Object.keys(nodes)[0]){
    //console.log("CENTERNODE:" + centerNodeId)
    // propagateDepth in the tree, returns the relative min-/max-depth of given node
    function _propagateDepth(node,depth){
      if(!node){return;}
      //console.log("_propagateDepth! "+node.id+" at depth "+depth)
      if(node.depth!=undefined){
        if(node.depth!=depth){
          throw "DepthError: "+node.id+" resolves to 2 different depths: "+node.depth+" and "+depth;
        }
        return;
      }
      let maxmindepths = [[depth,depth]]

      node.depth=depth
      maxmindepths.push(_propagateDepth(nodes[node.husb],depth))
      maxmindepths.push(_propagateDepth(nodes[node.wife],depth))
      maxmindepths.push(_propagateDepth(nodes[node.famc],depth-1))
      if(node.fams){
        node.fams.forEach(fam => maxmindepths.push(_propagateDepth(nodes[fam],depth)))
      }
      if(node.chil){
        node.chil.map(chil => maxmindepths.push(_propagateDepth(nodes[chil],depth+1)))
      }
      maxmindepths = maxmindepths.filter(mmd => mmd!=undefined)
      node.minDepth = d3.min(maxmindepths,d=>d[0]) 
      node.maxDepth = d3.max(maxmindepths,d=>d[1]) 
      return [node.minDepth,node.maxDepth];
    }

    _propagateDepth(nodes[centerNodeId],0)
    _.forEach(nodes, n=>{
      if(!n.depth){
        _propagateDepth(n,0)
      }
    })

    //ensure non-negative depths
    let minDepth = d3.min(_.map(nodes,n => n.depth))
    //nodes = _.mapValues(nodes, n=> {n.depth-=minDepth;return n})
    _.forEach(nodes,function(n){
      n.depth-=minDepth;
      n.minDepth-=minDepth;
      n.maxDepth-=minDepth;
    })

    return nodes;
  }

  _reorderNodesDepthFirst(nodes){
    let nodes2 = {}
    let root = _.find(nodes,n=>n.depth==0)
    _depthFirstOrder(root)

    function _depthFirstOrder(node){
      if(!node){return;}
      if(nodes2[node.id]){return;}

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
    _.map(nodesPerRow,(row,depth) => {
      let xpos = (this.width-rowsWidths[depth])/2
      let ypos = depth*(nodeSize.height+nodeSeparation.height) + nodeSize.height/2
      for(let i in row){
        xpos += row[i].nodeSize.width/2
        row[i].y = ypos
        row[i].x = xpos
        xpos += row[i].nodeSize.width/2 + nodeSeparation.width
      }
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

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

/* nodes should be in the form as a fTreeBuilderGedcom.nodes
links:
famc
husb
wife
fams[]
chil[]
*/
function computeNodesInitialPositions(nodes, centerNodeId){
  let nodeVisitIndex=0
    /*
  recursive function successively called on every node, starting at center
  x: x position of node
  dx: positive value, indicating by how much next nodes should be offset
  exteriorDirection: 1 or -1, indicates where is the exterior of the tree, relative to the last node computed
  */
  function _computeNodesInitialPositionsRecursive(node, x, dx, exteriorDirection){
    console.log("_computeNodesInitialPositionsRecursive() for node: "+node.id+" node.name: "+node.name+" X="+x.toFixed(2)+" dx="+dx.toFixed(2)+" extDir="+exteriorDirection)
    //sleep(10)
    /*
    for any node:
    - if x is set -> return;
    - set x as node x position
    node is individual:
    - propagate x, dx and exteriorDirection above and to other family nodes:
      - partner families: x' = x + exteriorDirection * dx, dx' = dx/2, extDir' = exteriorDirection
      - parent family: x' = x, dx' = dx/2, extDir' = exteriorDirection
    node is family:
    - sort partners as p1 and p2, p1's maxDepth > p2's maxDepth
    - sort children as c1, c2, ... cn, with c1's minDepth > ci's U-turn > ... > xn's U-turn
    - re-sort children with ci's score si' for sorting si' = -1^i * i (max score at extremities)
    - propagate x, dx and exteriorDirection above and to other indiv nodes:
      - p1's x' = x + exteriorDirection * dx, dx' = dx/2, extDir' = exteriorDirection
      - p2's x' = x - exteriorDirection * dx, dx' = dx/2, extDir' = - exteriorDirection
      - ci's x' = x + exteriorDirection * dx * i/n, dx' = dx/(n+1), extDir' = (n/2-i)/abs(n/2-i)

    */
    if(node.x!=undefined){
      return;
    }
    node.x=x
    node.visitIndex = nodeVisitIndex
    nodeVisitIndex++
    if(node.tag==="INDI"){
      if(node.famc) _computeNodesInitialPositionsRecursive(nodes[node.famc], x + exteriorDirection * dx, dx/2, exteriorDirection)
      // fams: only working for fams with only 1 element as of now
      if(node.fams) node.fams.forEach( n=> _computeNodesInitialPositionsRecursive(nodes[n], x + exteriorDirection * dx, dx/2, exteriorDirection))
    }
    if(node.tag==="FAM"){
      let partners = [node.wife,node.husb].sort(
        (n0,n1) => (n1==undefined? -1 : nodes[n1].maxDepth) - (n0==undefined? -1 : nodes[n0].maxDepth)
      ).filter(p => p)
      console.log("partners:")
      console.log(partners)
      partners = partners.filter(p => nodes[p].x===undefined) //only keep yet non-positioned partner(s)


      if(partners[0]) _computeNodesInitialPositionsRecursive(nodes[partners[0]], x + exteriorDirection * dx, dx/2, exteriorDirection)
      if(partners[1]) _computeNodesInitialPositionsRecursive(nodes[partners[1]], x - exteriorDirection * dx, dx/2, - exteriorDirection)

      let children = node.chil
      //console.log("children:")
      //console.log(children)
      children.filter(c => nodes[c].x===undefined) //only keep yet non-positioned children
      if(children.length>0){
        //console.log("children.length>0!")
        children = children.sort((c0,c1)=> c1.minDepth - c0.minDepth) // sort children with largest U-turn first
        let nbChil = children.length
        /* 
        //test of the dxFactor loop: good!
        var dxfs=[], eds=[],newxs=[],dx=100,exteriorDirection=1,x=0, nbChil=5;
        for (var i = 0; i<nbChil ; i++) {
          dxFactor = (i%2)==0? (nbChil-i-1)/(2*nbChil-2) : -(nbChil-i)/(2*nbChil-2) //dxFactor: put largest U-turns at extremities of layout
          dxfs.push(dxFactor)
          extDirFactor = Math.sign(dxFactor-nbChil/2+0.1)
          eds.push(extDirFactor)
          newx = x + exteriorDirection * dx * dxFactor
          newxs.push(newx)
        }
        */
        for (var i = 0; i<nbChil ; i++) {
          dxFactor = (i%2)==0? (nbChil-i-1)/(2*nbChil-2) : -(nbChil-i)/(2*nbChil-2) //dxFactor: put largest U-turns at extremities of layout
          extDirFactor = Math.sign(dxFactor-nbChil/2+0.1)
          newx = x + exteriorDirection * dx * dxFactor
          newdx = dx/(nbChil+1)
          //console.log("computing children position for child i="+i+":"+children[i])
          //console.log("nodes[children[i]]:")
          //console.log(nodes[children[i]])
          _computeNodesInitialPositionsRecursive(nodes[children[i]], newx, newdx, extDirFactor*exteriorDirection)
        }
      }//else{console.log("children.length==0!")}
    }
  }
  _computeNodesInitialPositionsRecursive(nodes[centerNodeId], 0,100,1);
  console.log("computeNodesInitialPositions() done! ")
  console.log("nodes with initial positions:")
  console.log(JSON.parse(JSON.stringify(nodes)))
  console.log("nodes[centerNodeId].x:")
  console.log(nodes[centerNodeId].x)
  console.log("nodes[centerNodeId]:")
  console.log(nodes[centerNodeId])
  return nodes;
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