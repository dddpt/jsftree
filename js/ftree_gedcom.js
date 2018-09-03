

/*
Algorithm with parse-gedcom:
- d3ize gedcom input in d3ized_ged
- give d3ized_ged and 1 id+depth as input to d3ftree
- d3ftree computes all the depth
  -> from origin node traversing through famc/fams links
- 
*/

class fTreeBuilderGedcom{
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
    this.nodes=data.nodes
    this.links=data.links
    //this.nodes= data.nodes.reduce((dic,node) => {dic[node.id] = node; return dic},{}) // transform data.nodes array into dictionnary
    //this.links=data.links.map(l => {return {source: data.nodes[l.source].id, target: data.nodes[l.target].id   }}) // change from nodes index to nodes id
    this.width = 0 // maximum width needed among the row

    // assume that all non-connected nodes start at depth 0
    // and set nodeSize to given nodesize for nodes and {0,0} for family nodes
    this.nodes = this.nodes.map(n=>{
      if(!n.depth)
      this._propagateDepth(n,0)
      //n.hidden = n.tag==="FAM"
      n.nodeSize = n.tag==="FAM"? {width:10,height:10} : this.nodeSize;
      if(n.tag==="FAM"){
        n.name+= " "+(n.husb?n.husb.name:"")+","+(n.wife?n.wife.name:"")
      }
      return n
    })
    //ensure non-negative depths
    console.log("this.nodes")
    console.log(this.nodes)
    let minDepth = d3.min(this.nodes, n=>n.depth)
    console.log("minDepth = "+minDepth)
    for(var i in this.nodes){
      this.nodes[i].depth-=minDepth
    }
  
    this._computeLayout()
  }

  _propagateDepth(node,depth){
    if(!node){return;}
    console.log("_propagateDepth! "+node.id+" at depth "+depth)
    if(node.depth!=undefined){
      if(node.depth!=depth){
        throw "DepthError: "+node.id+" resolves to 2 different depths: "+node.depth+" and "+depth;
      }
      return;
    }
    node.depth=depth
    this._propagateDepth(node.husb,depth)
    this._propagateDepth(node.wife,depth)
    this._propagateDepth(node.famc,depth-1)
    if(node.fams){
      node.fams.map(fam => this._propagateDepth(fam,depth))
    }
    if(node.chil){
      node.chil.map(chil => this._propagateDepth(chil,depth+1))
    }
    return;
  }

  _computeLayout(){
    //let elementsPerRow = _.countBy(this.depths)
    //let rowWidth = elementsPerRow * (this.nodeSize.width + this.nodeSeparation.width) - this.nodeSeparation.width
    let nodesPerRow = _.groupBy(this.nodes, n => n.depth)
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

  getNodeById(id){
    this.nodes.filter(n=>n.id===id)[0]
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