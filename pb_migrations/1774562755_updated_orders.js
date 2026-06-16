/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select2223302008",
    "maxSelect": 1,
    "name": "paymentMethod",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "qr",
      "transferencia"
    ]
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "select3961971146",
    "maxSelect": 1,
    "name": "tipoSolicitud",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "contado",
      "credito",
      "visita",
      "entrega"
    ]
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "json936132376",
    "maxSize": 0,
    "name": "clienteData",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(14, new Field({
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

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "select1765320913",
    "maxSelect": 1,
    "name": "pagoEstado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente_validacion",
      "validado",
      "rechazado"
    ]
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "date1487669057",
    "max": "",
    "min": "",
    "name": "fechaComprobante",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "date3303131586",
    "max": "",
    "min": "",
    "name": "fechaValidacion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3048358955",
    "max": 0,
    "min": 0,
    "name": "validadoPor",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "date1269603864",
    "max": "",
    "min": "",
    "name": "startDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // remove field
  collection.fields.removeById("select2223302008")

  // remove field
  collection.fields.removeById("select3961971146")

  // remove field
  collection.fields.removeById("json936132376")

  // remove field
  collection.fields.removeById("relation1440673410")

  // remove field
  collection.fields.removeById("select1765320913")

  // remove field
  collection.fields.removeById("date1487669057")

  // remove field
  collection.fields.removeById("date3303131586")

  // remove field
  collection.fields.removeById("text3048358955")

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "date1269603864",
    "max": "",
    "min": "",
    "name": "startDate",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
