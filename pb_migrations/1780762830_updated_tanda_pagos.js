/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3876073281")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select922717044",
    "maxSelect": 1,
    "name": "tipoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "primera_parte",
      "segunda_parte"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3876073281")

  // remove field
  collection.fields.removeById("select922717044")

  return app.save(collection)
})
