/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select3844014757",
    "maxSelect": 1,
    "name": "estadoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente_pago",
      "activa",
      "completada",
      "cancelada"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select3844014757",
    "maxSelect": 1,
    "name": "estadoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente_pago",
      "activa",
      "completada",
      "cancelada",
      "atrasada"
    ]
  }))

  return app.save(collection)
})
