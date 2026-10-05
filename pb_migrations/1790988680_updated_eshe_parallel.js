/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3655375820")

  // remove field
  collection.fields.removeById("select1309676077")

  // add field
  collection.fields.addAt(31, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2687480828",
    "hidden": false,
    "id": "relation4180551237",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "categoriaId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3655375820")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1309676077",
    "maxSelect": 1,
    "name": "categoria",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Blazers",
      "Camisas",
      "Playeras",
      "Pantalones",
      "Jeans",
      "Vestidos",
      "Faldas",
      "Sudaderas",
      "Chamarras",
      "Abrigos",
      "Suéteres",
      "Shorts",
      "Accesorios",
      "Calzado",
      "Bolsos",
      "Otro"
    ]
  }))

  // remove field
  collection.fields.removeById("relation4180551237")

  return app.save(collection)
})
