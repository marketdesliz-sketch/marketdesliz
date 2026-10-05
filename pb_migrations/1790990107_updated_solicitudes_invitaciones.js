/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_236497258")

  // update field
  collection.fields.addAt(12, new Field({
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
      "en_diseno",
      "cancelada",
      "aprobada",
      "entregada",
      "contactada"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_236497258")

  // update field
  collection.fields.addAt(12, new Field({
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
      "contactado",
      "en_diseno",
      "aprobado",
      "entregado",
      "cancelado"
    ]
  }))

  return app.save(collection)
})
