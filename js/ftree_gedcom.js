

class fTreeBuilderGedcom{
  constructor(data, nodeSize, nodeSeparation, centerNodeId){
    /*
    data should be an object with keys "nodes" and "links" as returned by addLinksToNodes() after parseGedcom.d3ize() a gedcom file
    */
    // if no centerNodeId, set it as the first family with 2 spouses
    if(!centerNodeId){
      for(let n in data.nodes){
        if(data.nodes[n].tag==="FAM" & (data.nodes[n].husb!=undefined | data.nodes[n].wife!=undefined)) // only 1 spouse
          centerNodeId=data.nodes[n].id;
        if(data.nodes[n].tag==="FAM" & data.nodes[n].husb!=undefined & data.nodes[n].wife!=undefined){
          centerNodeId=data.nodes[n].id;
          break;
        }
      }
    }

    this.nodeSize = nodeSize
    this.nodeSeparation = nodeSeparation
    this.centerNodeId = centerNodeId
    this.nodes= data.nodes.reduce((dic,node) => {dic[node.id] = node; return dic},{}) // transform data.nodes array into dictionnary
    this.links=data.links.map(l => {return {source: data.nodes[l.source].id, target: data.nodes[l.target].id   }}) // change from nodes index to nodes id
    this.maxDepth = 0

    // add nodeSize to nodes and names to family nodes
    this.nodes = _.mapValues(this.nodes,n=>{
      //n.hidden = n.tag==="FAM"
      n.nodeSize = n.tag==="FAM"? {width:10,height:10} : nodeSize;
      if(n.tag==="FAM"){
        n.name+= " "+(n.husb? this.nodes[n.husb].name:"")+","+(n.wife?this.nodes[n.wife].name:"")
      }
      return n
    })

    //compute nodes positions
    this._computeDepths()
    this._computeNodesRowOrder()
    this._computeNodesInitialPositions()
  }

  nodesArray(){
    return _.map(this.nodes, n=>n)
  }

  linksAsReferences(){
    return this.links.map(l=>{
      return {
        source:this.nodes[l.source],
        target:this.nodes[l.target]
      }
    })
  }


  /*
  Computes depth of all the nodes in the family tree
  Also computes max- and min-deph reachable from node relative to centerNode
  adds following properties to each node:
  - depth
  - minDepth
  - maxDepth
  */
  _computeDepths(){
    //console.log("CENTERNODE:" + this.centerNodeId)
    // propagateDepth in the tree, returns the relative min-/max-depth of given node

    this._computeDepthsRecursive(this.nodes[this.centerNodeId],0)
    _.forEach(this.nodes, n=>{
      if(!n.depth){
        this._computeDepthsRecursive(n,0)
      }
    })

    //ensure non-negative depths & compute family tree global maximum depth
    let depthExtent = d3.extent(_.map(this.nodes,n => n.depth))
    let minDepth = depthExtent[0]
    this.maxDepth = depthExtent[1]-minDepth
    //this.nodes = _.mapValues(this.nodes, n=> {n.depth-=minDepth;return n})
    _.forEach(this.nodes,function(n){
      n.depth-=minDepth;
      n.minDepth-=minDepth;
      n.maxDepth-=minDepth;
    })
  }

  _computeDepthsRecursive(node,depth){
    if(!node){return;}
    //console.log("_computeDepthsRecursive! "+node.id+" at depth "+depth)
    if(node.depth!=undefined){
      if(node.depth!=depth){
        throw "DepthError: "+node.id+" resolves to 2 different depths: "+node.depth+" and "+depth;
      }
      return;
    }
    let maxmindepths = [[depth,depth]]

    node.depth=depth
    maxmindepths.push(this._computeDepthsRecursive(this.nodes[node.husb],depth))
    maxmindepths.push(this._computeDepthsRecursive(this.nodes[node.wife],depth))
    maxmindepths.push(this._computeDepthsRecursive(this.nodes[node.famc],depth-1))
    if(node.fams){
      node.fams.forEach(fam => maxmindepths.push(this._computeDepthsRecursive(this.nodes[fam],depth)))
    }
    if(node.chil){
      node.chil.map(chil => maxmindepths.push(this._computeDepthsRecursive(this.nodes[chil],depth+1)))
    }
    maxmindepths = maxmindepths.filter(mmd => mmd!=undefined)
    node.minDepth = d3.min(maxmindepths,d=>d[0]) 
    node.maxDepth = d3.max(maxmindepths,d=>d[1]) 
    return [node.minDepth,node.maxDepth];
  }

  /*
  Function computing family tree nodes' order in each depth-row
  _computeDepths() must have been called before

  Ensure minimal descendancy-lines-crossing in common cases, ensures:
  - parent/child with the most descendancy&ascendancy is put on the exterior side of the family tree
  crossings happen if:
  - the spouse of a descendant of another node have ancestry in the tree
  - both parents' couples of an ancestor couple have grand-children
  - other cases where crossings are non-avoidable
  */
  _computeNodesRowOrder(){
    let nodeVisitIndex=0;
    // global min/max x position at depth of center node
    let minxCenterDepth=0,
      maxxCenterDepth=0,
      centerDepth = this.nodes[this.centerNodeId].depth;
    // minimal dx factor
    let mindx=100

    // taken out of this: otherwise _computeNodesRowOrderRecursive() cannot access them
    let nodes = this.nodes
    let nodeSize = this.nodeSize
    let nodeSeparation = this.nodeSeparation


    /*
    recursive function successively called on every node, starting at centerNode
    node: node whose row order will be computed
    x: x position of node
    dx: positive value, indicating by how much next nodes should be offset
    exteriorDirection: 1 or -1, indicates where is the exterior of the tree, relative to the last node computed
    */
    function _computeNodesRowOrderRecursive(node, x, dx, exteriorDirection){
      if(node.x!=undefined){ // stop condition: node.x already defined
        return;
      }
      //console.log("_computeNodesRowOrderRecursive() for "+nodeVisitIndex+"th node.id="+node.id+" node.name="+node.name+" node.depth="+node.depth+" X="+x.toFixed(2)+" dx="+dx.toFixed(2)+" extDir="+exteriorDirection)
      
      if(node.depth==centerDepth){
        minxCenterDepth = minxCenterDepth<x? minxCenterDepth:x;
        maxxCenterDepth = maxxCenterDepth>x? maxxCenterDepth:x;
      }
      node.x=x
      //node.y=node.depth*(node.nodeSize.height+node.nodeSeparation.height) + node.nodeSize.height/2
      node.y=node.depth*(nodeSize.height+nodeSeparation.height) + nodeSize.height/2
      node.fy=node.y
      node.visitIndex = nodeVisitIndex
      nodeVisitIndex++
      mindx = mindx<dx?mindx:dx;
      if(node.tag==="INDI"){ // node of an individual
        let famcx = x + exteriorDirection * dx
        if(node.depth==centerDepth+1 & famcx> minxCenterDepth & famcx < maxxCenterDepth){
          famcx = famcx-minxCenterDepth < maxxCenterDepth-famcx? minxCenterDepth-20 : maxxCenterDepth+20;
        }
        if(node.famc) _computeNodesRowOrderRecursive(nodes[node.famc], famcx, dx/2, exteriorDirection)
        // fams: only working for fams with only 1 element as of now
        if(node.fams) node.fams.forEach( n=> _computeNodesRowOrderRecursive(nodes[n], x + exteriorDirection * dx, dx/2, exteriorDirection))
      }
      if(node.tag==="FAM"){ // family node
        let partners = [node.wife,node.husb].sort(
          (n0,n1) => (n1==undefined? -1 : 100*nodes[n1].maxDepth-nodes[n1].minDepth) - (n0==undefined? -1 : 100*nodes[n0].maxDepth-nodes[n0].minDepth)
        ).filter(p => p)
        partners = partners.filter(p => nodes[p].x===undefined) //only keep yet non-positioned partner(s)

        if(partners[0]) _computeNodesRowOrderRecursive(nodes[partners[0]], x + exteriorDirection * dx, dx/2, exteriorDirection)
        if(partners[1]) _computeNodesRowOrderRecursive(nodes[partners[1]], x - exteriorDirection * dx, dx/2, - exteriorDirection)

        let children = node.chil
        children.filter(c => nodes[c].x===undefined) //only keep yet non-positioned children
        if(children.length>0){
          children = children.sort((c0,c1)=> 100*c1.minDepth-c1.maxDepth - (100*c0.minDepth-c0.maxDepth)) // sort children with largest U-turn first
          let nbChil = children.length
          for (var i = 0; i<nbChil ; i++) {
            let numerator = nbChil==1? 1 : (2*nbChil-2)
            let dxFactor = (i%2)==0? (nbChil-i-1)/numerator : -(nbChil-i)/numerator //dxFactor: put largest U-turns at extremities of layout
            let extDirFactor = Math.sign(dxFactor+0.0001)
            let newx = x + exteriorDirection * dx * dxFactor
            let newdx = dx/(2*(nbChil+1))
            if(node.depth==centerDepth-1 & newx> minxCenterDepth & newx < maxxCenterDepth){
              newx = newx-minxCenterDepth < maxxCenterDepth-newx? minxCenterDepth-20 : maxxCenterDepth+20;
            }
            _computeNodesRowOrderRecursive(nodes[children[i]], newx, newdx, extDirFactor*exteriorDirection)
          }
        }
      }
    }
    _computeNodesRowOrderRecursive(this.nodes[this.centerNodeId], 0,mindx,1, this);
  }

  /*
  Compute nodes initial positions before adjusting them with applyForces() 
  _computeNodesRowOrder() must have been called before

  depth-rows can either be:
  - justified: all rows take the same widths, and first and last nodes of each row are at the extremities
  - centered: all nodes in a row have fixed horizontal distance and are centered.
  */
  _computeNodesInitialPositions(justified=false){
    let nodesPerRow = _.groupBy(this.nodes, n => n.depth)
    let rowsWidths = _.map(nodesPerRow,r => _.sumBy(r,v=>this.nodeSize.width+this.nodeSeparation.width))
    rowsWidths = rowsWidths.map(rw=>rw-this.nodeSeparation.width) // delete last useless separation
    let maxWidth = _.max(rowsWidths)
    _.map(nodesPerRow,(row,depth) => {
      row.sort((a,b) => a.x-b.x)
      let xpos = justified? -maxWidth/2 : (maxWidth-rowsWidths[depth])/2
      let xFactor = maxWidth/rowsWidths[depth]
      let ypos = depth*(this.nodeSize.height+this.nodeSeparation.height) + this.nodeSize.height/2
      for(let i in row){
        xpos += justified? xFactor*this.nodeSize.width/2 : this.nodeSize.width/2
        row[i].y = ypos
        row[i].fy = ypos
        row[i].x = xpos
        xpos += justified? xFactor*(this.nodeSize.width/2 + this.nodeSeparation.width) : (this.nodeSize.width/2 + this.nodeSeparation.width)
      }
    })

  }

  /*
  Apply forces to family-tree graph to have nicer layout
  _computeNodesInitialPositions() must have been called before

  simulation's and forces' parameters chosen in the function are good for small trees.
  For large trees (>20nodes), do not use this function, copy-paste its code and use adapted parameters.
  */
  applyForces(instantaneous=true){
    let simulation = d3.forceSimulation()
      .nodes(this.nodesArray())
      .stop()
      .force("charge", d3.forceManyBody().strength(-2*(this.nodeSeparation.width+this.nodeSize.width)))
      //.force("centering", d3.forceCenter(width/2,height/2))
      .force("collision", d3.forceCollide((this.nodeSeparation.width+this.nodeSize.width)/2.1).strength(1))
      .force("link", d3.forceLink(this.links).distance(this.nodeSeparation.height/100).strength(0.9).id(d=>d.id))
      .velocityDecay(0.4)
      .alphaDecay(0.01);
    
    while(instantaneous & simulation.alpha()>simulation.alphaMin()){
      simulation.tick()
    }

    return simulation;
  }

  /*
  Re-centers the graph on the center node: gives the center-node the given position and rearrange all other nodes arround it
  */
  center(xCenterNode=0, yCenterNode=0){
    let xoffset = xCenterNode-this.nodes[this.centerNodeId].x
    let yoffset = yCenterNode-this.nodes[this.centerNodeId].y
    _.forEach(this.nodes, n=>{
      n.x+=xoffset
      n.y+=yoffset
    })
    return this;
  }

  width(){
    let extent = d3.extent(_.map(this.nodes,n=>n.x))
    return extent[1]-extent[0];
  }
  height(){
    let extent = d3.extent(_.map(this.nodes,n=>n.y))
    return extent[1]-extent[0];
  }

  minX(){
    return d3.min(_.map(this.nodes,n=>n.x));
  }
  minY(){
    return d3.min(_.map(this.nodes,n=>n.y));
  }
}

const d3FamilyTree = function(data, nodeSize={width:50,height:50}, nodeSeparation={width:100,height:100}, centerNodeId){
  let ftree = new fTreeBuilderGedcom(data, nodeSize, nodeSeparation, centerNodeId)


  return ftree
}