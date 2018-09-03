


/*
  takes care of adding to individuals:
  - famc:famc_id the id of the parents' family node
  - fams:[fams_ids] array of ids of families this individual is a parent in
  ...and adding to family nodes:
  - husb
  - wife
  - children:[] nodes
*/
function addLinksToNodes(nodes){

  function addLinksToNode(node){
    famc = getTagsData(node,"FAMC")[0]
    if(famc){
      node.famc=famc //getNodeFromId(nodes, famc)
    }
    husb = getTagsData(node,"HUSB")[0]
    if(husb){
      node.husb=husb//getNodeFromId(nodes, husb)
    }
    wife = getTagsData(node,"WIFE")[0]
    if(wife){
      node.wife=wife//getNodeFromId(nodes, wife)
    }

    fams = getTagsData(node,"FAMS")
    if(fams[0]){
      node.fams=fams//.map(n => getNodeFromId(nodes, n))
    }
    chil = getTagsData(node,"CHIL")
    if(chil[0]){
      node.chil=chil//.map(n => getNodeFromId(nodes, n))
    }
    return node;
  }
  
  return nodes.map(addLinksToNode);
}

// gets an array of the data of all tags corresponding to the given tag
function getTagsData(node,tag) {
  var tags = (node.tree.filter(e => e.tag ===tag) || []);
  return tags.map(t=>t.data);
}

function getNodeFromId(nodes,id) {
  return nodes.filter(n=>n.id===id)[0];
}