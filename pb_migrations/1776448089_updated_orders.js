/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // remove field
  collection.fields.removeById("select1765320913")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "activa",
      "completada",
      "cancelada"
    ]
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select2223302008",
    "maxSelect": 1,
    "name": "metodoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "transferencia",
      "qr_vendedor"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "select1765320913",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente_validacion",
      "activa",
      "completada",
      "cancelada"
    ]
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "completed",
      "cancelled",
      "pending_delivery",
      "activo"
    ]
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select2223302008",
    "maxSelect": 1,
    "name": "paymentMethod",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "transferencia",
      "qr_vendedor"
    ]
  }))

  return app.save(collection)
})
