
treeData = [{
    "name": "Niclas Superlongsurname",
    "class": "man",
    "textClass": "emphasis",
    "marriages": [{
      "spouse": {
        "name": "Iliana",
        "class": "woman",
        "extra": {
            "nickname": "Illi"
        }
      },
      "children": [{
        "name": "James",
        "class": "man",
        "marriages": [{
          "spouse": {
            "name": "Alexandra",
            "class": "woman"
          },
          "children": [{
            "name": "Eric",
            "class": "man",
            "marriages": [{
              "spouse": {
                "name": "Eva",
                "class": "woman"
              }
            }]
          }, {
            "name": "Jane",
            "class": "woman"
          }, {
            "name": "Jasper",
            "class": "man"
          }, {
            "name": "Emma",
            "class": "woman"
          }, {
            "name": "Julia",
            "class": "woman"
          }, {
            "name": "Jessica",
            "class": "woman"
          }]
        },
        {
          "spouse": {
            "name": "Beatriz",
            "class": "woman"
          },
          "children": [{
            "name": "Zolange",
            "class": "woman"
          },{
            "name": "Zalicia",
            "class": "woman"
          }]
        },
        {
          "spouse": {
            "name": "claricia",
            "class": "woman"
          },
          "children": [{
            "name": "Colange",
            "class": "woman"
          },{
            "name": "Calicia",
            "class": "woman"
          }]
        }]
      }]
    }]
}]

/*function circleNodeRenderer(name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer) {
//<foreignObject x="-110px" y="48px" width="100px" height="24px" id="1"><circle r="20" class="man" id="node1">
//<p class="emphasis" align="center">Niclas Superlongsurname</p></circle></foreignObject>
  r=20

  var node = '';
  node += '<circle r=20 '//+ height/2+">";
  node += 'cx="' + (x+r/2) + '" ';
  node += 'cx="' + (y+r/2) + '" ';
  node += 'class="' + nodeClass + '" ';
  node += 'id="node' + id + '">\n';
  node += textRenderer(name, extra, textClass);
  node += '</circle>';
  return node;
}*/

function circleNodeRenderer(name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer) {
  var node = '';
  node += '<div ';
  node += 'style="height:100px;width:100px;border-radius: 100%;" ';
  node += 'class="' + nodeClass + '" ';
  node += 'id="node' + id + '">\n';
  node += '<i class="fas fa-' + (nodeClass=="man"? "mars": "venus") + ' sex-symbol"></i>';
  node += textRenderer(name, extra, textClass);
  node += '</div>';
  return node;
}

function circleNodeSize(nodes, width, textRenderer){
  var maxWidth = 0;
  var maxHeight = 0;
  var tmpSvg = document.createElement('svg');
  document.body.appendChild(tmpSvg);

  _.map(nodes, function (n) {
    if (n.data.hidden) {
      n.cWidth = 0;
      n.cWidth = 0;
    } else {
      n.cWidth = width+2;
      n.cHeight = width+2;
    }
  });
  document.body.removeChild(tmpSvg);

  return [width, width];
}

dTree.init(treeData, {
  target: "#graph",
  debug: true,
  height: 800,
  width: 1200,
  callbacks: {
    nodeClick: function(name, extra) {
      console.log(name);
    },
    textRenderer: function(name, extra, textClass) {
        if (extra && extra.nickname)
          name = name + " (" + extra.nickname + ")";
        return "<p align='center' class='" + textClass + "'>" + name + "</p>";
    },
    nodeRenderer: circleNodeRenderer
    ,nodeSize:circleNodeSize
  }
});
