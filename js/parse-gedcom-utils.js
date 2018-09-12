


/*
  takes care of adding to individuals nodes:
  - famc:famc_id the id of the parents' family node
  - fams:[fams_ids] array of ids of families this individual is a parent in
  ...and adding to family nodes:
  - husb
  - wife
  - chil:[] 
*/
function addLinksToNodes(nodes, onlyId = true){

  function addLinksToNode(node){
    famc = getTagsData(node,"FAMC")[0]
    if(famc){
      node.famc = onlyId? famc : getNodeFromId(nodes, famc)
    }
    husb = getTagsData(node,"HUSB")[0]
    if(husb){
      node.husb = onlyId? husb : getNodeFromId(nodes, husb)
    }
    wife = getTagsData(node,"WIFE")[0]
    if(wife){
      node.wife = onlyId? wife : getNodeFromId(nodes, wife)
    }

    fams = getTagsData(node,"FAMS")
    node.fams = onlyId? fams : fams.map(n => getNodeFromId(nodes, n))
    
    chil = getTagsData(node,"CHIL")
    node.chil = onlyId? chil : chil.map(n => getNodeFromId(nodes, n))
    
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





// Utility function
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}