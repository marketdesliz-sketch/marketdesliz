/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4276131293")

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select643686883",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "cancelada",
      "no_encontrado"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4276131293")

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select643686883",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "completada",
      "cancelada",
      "no_encontrado"
    ]
  }))

  return app.save(collection)
})
