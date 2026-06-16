/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select4228912797",
    "maxSelect": 1,
    "name": "estado_kyc",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "aprobado",
      "rechazado"
    ]
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number1585730330",
    "max": null,
    "min": null,
    "name": "puntaje_confianza",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select4228912797",
    "maxSelect": 1,
    "name": "kycStatus",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pending",
      "approved",
      "rejected"
    ]
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number1585730330",
    "max": null,
    "min": null,
    "name": "trustScore",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
