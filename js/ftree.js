var gdepths = 0


class fTreeBuilder{
  constructor(data, nodeSize, nodeSeparation){
    /*
    data is an array containing data for a family-tree:
    - eldest family tree root must be the first element
    - each element is a family member and its descendance, filled depth first
      -> the first element contains all the descendance of the eldest family tree root
    a family member is of the form
    {
      name: "name",
      id:"id",
      marriages:[
        {
          spouse:{spouse_family_member},
          children:[
            {child1},
            {child2},
            {childi...}
          ]
        }
      ]
    }

    */

    this.nodeSize = nodeSize  // object with width and height value
    this.nodeSeparation = nodeSeparation // object with width and height value
    this.flatNodes = {} // object id->node
    this.depths = {} // object node_id->depth of node
    this.depths[data[0].id] = 0 // initialize depth of root node
    this.width = 0 // maximum width needed among the row

    // add the whole family tree sequentially 
    data.map((node,i) => this.addSubtree(node,undefined,undefined,this.nodeSize,false))
    this._computeLayout()
  }

  // computes depth of given node, has no side effects
  _computeDepth(node){
    console.log("_computeDepth for node: "+node.id)
    if(node.id in this.depths){
      return(this.depths[node.id])
    }
    if(node.marriages){
      let spouses_depth = node.marriages.map( m => this.depths[m.spouse.id]).filter(d=>d!=undefined)[0]
      if(spouses_depth!=undefined){return(spouses_depth)}

      let childrenNodes = _.flatten(node.marriages.map( m => m.children))
      for(let i in childrenNodes){
        let cdepth = this._computeDepth(childrenNodes[i])
        if(cdepth!=undefined) return(cdepth-1)
      }
    }
    return(0) // if depth not found: depth is level 0
  }

  _computeLayout(){
    //let elementsPerRow = _.countBy(this.depths)
    //let rowWidth = elementsPerRow * (this.nodeSize.width + this.nodeSeparation.width) - this.nodeSeparation.width
    let nodesPerRow = _.groupBy(this.flatNodes, n => n.depth)
    //let rowsWidths = Object.keys(nodesPerRow).map(r => _.sumBy(nodesPerRow[r],v=>v.nodeSize.width+this.nodeSeparation.width))
    let rowsWidths = _.map(nodesPerRow,r => _.sumBy(r,v=>v.nodeSize.width+this.nodeSeparation.width))
    rowsWidths = rowsWidths.map(rw=>rw-this.nodeSeparation.width) // delete last useless separation
    this.width = _.max(rowsWidths)
    console.log("nodesPerRow:")
    console.log(nodesPerRow)
    console.log("rowsWidths:")
    console.log(rowsWidths)
    console.log("this.width "+this.width)
    _.map(nodesPerRow,(row,depth) => {
      console.log("ROW "+depth)
      let xpos = (this.width-rowsWidths[depth])/2
      let ypos = depth*(this.nodeSize.height+this.nodeSeparation.height) + this.nodeSize.height/2
      for(let i in row){
        console.log("id: "+row[i].id+", xpos: "+xpos+", ypos: "+ypos)
        xpos += row[i].nodeSize.width/2
        row[i].y = ypos
        row[i].x = xpos
        xpos += row[i].nodeSize.width/2 + this.nodeSeparation.width
      }
      console.log("=====")
    })

  }

  // Function adding the subtree starting at node to flatNodes
  // - if no depth given, computes it using _computeDepth
  // - note that if a node is only updated (versus added), addSubTree(updatedNode, ...) will do nothing
  addSubtree(node, linkedNode, depth, nodeSize,hidden){
    // if node already flatNodes: exit immediately 
    if(this.flatNodes[node.id]){
      node = this.flatNodes[node.id]
    }

    console.log("addSubtree for node: "+node.id+" with depth "+depth)
    // add depth
    if(depth==undefined){
      depth = this._computeDepth(node)
      console.log("depth found: "+depth)
    }
    node.depth=depth
    this.depths[node.id] = depth
    // add node
    if(!node.linkedNodes){
      node.linkedNodes=linkedNode?[linkedNode]:[]
    }
    else{
      node.linkedNodes.push(linkedNode)
    }
    node.nodeSize=nodeSize
    node.hidden=hidden
    this.flatNodes[node.id] = node

    //add marriages, spouse & children nodes
    if(node.spouse){      
      node.spouse = this.addSubtree(node.spouse, node, depth, this.nodeSize,false)
    }
    if(node.marriages){
      node.marriages = node.marriages.map( m => {
        m.id=[node.id,m.spouse.id].sort().toString()
        return(this.addSubtree(m,node,depth,{width:0,height:0},true))
      })
    }
    if(node.children){
      node.children.map( c => this.addSubtree(c, node, depth+1, this.nodeSize,false))
    }

    return(node)
  }

  nodes(){
    return(_.values(this.flatNodes))
  }

  links(){
    return(_.flatten(_.values(this.flatNodes).map(n=> n.linkedNodes.map(p=>
      {return({
      source:{
        id:n.id,
        x:n.x,
        y:n.y,
      },
      target:{
        id:p.id,
        x:p.x,
        y:p.y
      }
    })
      }))))
    }
}

const d3ftree={
  init: function(data){
    return(new fTreeBuilder(data))

  },
}
