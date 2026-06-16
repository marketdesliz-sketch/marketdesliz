/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2662128332")

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select232563784",
    "maxSelect": 1,
    "name": "subcategory",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Camisas",
      "Pantalones",
      "Vestidos",
      "Faldas",
      "Ropa Deportiva"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2662128332")

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select232563784",
    "maxSelect": 1,
    "name": "subcategory",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Camisas",
      "Pantalones",
      "Tenis"
    ]
  }))

  return app.save(collection)
})
