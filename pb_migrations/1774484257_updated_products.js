/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // update field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select232563784",
    "maxSelect": 1,
    "name": "subcategory",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Refrigeradores",
      "Lavadoras",
      "Secadoras",
      "Microondas",
      "Estufas",
      "Hornos",
      "Celulares"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // update field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select232563784",
    "maxSelect": 1,
    "name": "subcategory",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Refrigeradores",
      "Lavadoras",
      "Secadoras",
      "Microondas",
      "Estufas",
      "Hornos"
    ]
  }))

  return app.save(collection)
})
