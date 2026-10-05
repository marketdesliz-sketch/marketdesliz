/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2687480828")

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select2826335388",
    "maxSelect": 1,
    "name": "vertical",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "eshe_parallel",
      "frutas",
      "ganado",
      "servicios",
      "products"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2687480828")

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select2826335388",
    "maxSelect": 1,
    "name": "vertical",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "productos",
      "eshe_parallel",
      "frutas",
      "ganado",
      "servicios"
    ]
  }))

  return app.save(collection)
})
