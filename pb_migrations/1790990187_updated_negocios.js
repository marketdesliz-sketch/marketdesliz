/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select221103594",
    "maxSelect": 1,
    "name": "estadoActivacion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente_activacion",
      "activo",
      "rechazada"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select221103594",
    "maxSelect": 1,
    "name": "estadoActivacion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente_activacion",
      "activo",
      "rechazado"
    ]
  }))

  return app.save(collection)
})
