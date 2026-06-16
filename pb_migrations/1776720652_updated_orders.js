/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1333114863",
    "hidden": false,
    "id": "relation1440673410",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "comprobanteId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "select267881136",
    "maxSelect": 1,
    "name": "estadoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "validado",
      "rechazado"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1333114863",
    "hidden": false,
    "id": "relation1440673410",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "comprobante",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "select267881136",
    "maxSelect": 1,
    "name": "estado_pago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "validado",
      "rechazado"
    ]
  }))

  return app.save(collection)
})
