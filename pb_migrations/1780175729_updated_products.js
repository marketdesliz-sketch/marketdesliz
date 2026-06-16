/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // remove field
  collection.fields.removeById("select1309676077")

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1309676077",
    "max": 0,
    "min": 0,
    "name": "categoria",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "file929718273",
    "maxSelect": 99,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "imagenes",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "bool720804565",
    "name": "destacado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "number8424862",
    "max": null,
    "min": null,
    "name": "ventas",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "number593624199",
    "max": null,
    "min": null,
    "name": "visitas",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // add field
  collection.fields.addAt(9, new Field({
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
      "ganado",
      "servicios"
    ]
  }))

  // remove field
  collection.fields.removeById("text1309676077")

  // remove field
  collection.fields.removeById("file929718273")

  // remove field
  collection.fields.removeById("bool720804565")

  // remove field
  collection.fields.removeById("number8424862")

  // remove field
  collection.fields.removeById("number593624199")

  return app.save(collection)
})
