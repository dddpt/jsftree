[{
  "name": "Father",                         // The name of the node
  "class": "node",                          // The CSS class of the node
  "textClass": "nodeText",                  // The CSS class of the text in the node
  "depthOffset": 1,                         // Generational height offset
  "marriages": [{                           // Marriages is a list of nodes
    "spouse": {                             // Each marriage has one spouse
      "name": "Mother",
    },
    "children": [{                          // List of children nodes
      "name": "Child"
    }]
  }],
  "extra": {}                               // Custom data passed to renderers
}]