/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // remove field
  collection.fields.removeById("select1309676077")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "select1309676077",
    "maxSelect": 1,
    "name": "categoria",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "electronica",
      "hogar",
      "ropa",
      "instrumentos",
      "cortinas",
      "sabanas",
      "almohadas",
      "cubre-salas",
      "botes",
      "sillas",
      "bancos-plastico",
      "baterias-peltre",
      "acero-inoxidable",
      "vapoderas",
      "sartenes",
      "colchones",
      "bases-cama",
      "cajoneras",
      "licuadoras",
      "bocinas",
      "mesas",
      "batidoras",
      "planchas",
      "ventiladores",
      "anaqueles"
    ]
  }))

  return app.save(collection)
})
