/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // remove field
  collection.fields.removeById("number674557499")

  // add field
  collection.fields.addAt(17, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation1689669068",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "userId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2604406982",
    "hidden": false,
    "id": "relation3748578879",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "vendedorId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "number621261048",
    "max": null,
    "min": null,
    "name": "enganche",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number1657641776",
    "max": null,
    "min": null,
    "name": "pagoSemanal",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number126293115",
    "max": null,
    "min": null,
    "name": "semanasTotales",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number1417457498",
    "max": null,
    "min": null,
    "name": "totalPagar",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number3309073873",
    "max": null,
    "min": null,
    "name": "saldoRestante",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
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

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select3961971146",
    "maxSelect": 1,
    "name": "tipo",
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

  // update field
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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "number674557499",
    "max": null,
    "min": null,
    "name": "totalPrice",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // remove field
  collection.fields.removeById("relation1689669068")

  // remove field
  collection.fields.removeById("relation3748578879")

  // update field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "number621261048",
    "max": null,
    "min": null,
    "name": "weeklyAmount",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number1657641776",
    "max": null,
    "min": null,
    "name": "totalWeeks",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number126293115",
    "max": null,
    "min": null,
    "name": "remainingBalance",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number1417457498",
    "max": null,
    "min": null,
    "name": "paymentAmount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number3309073873",
    "max": null,
    "min": null,
    "name": "downPayment",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(10, new Field({
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

  // update field
  collection.fields.addAt(11, new Field({
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

  // update field
  collection.fields.addAt(14, new Field({
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

  return app.save(collection)
})
