/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // remove field
  collection.fields.removeById("number621261048")

  // remove field
  collection.fields.removeById("number1657641776")

  // remove field
  collection.fields.removeById("number126293115")

  // remove field
  collection.fields.removeById("select2063623452")

  // remove field
  collection.fields.removeById("number1417457498")

  // remove field
  collection.fields.removeById("number3309073873")

  // remove field
  collection.fields.removeById("select2223302008")

  // remove field
  collection.fields.removeById("select3961971146")

  // remove field
  collection.fields.removeById("date1487669057")

  // remove field
  collection.fields.removeById("date3303131586")

  // remove field
  collection.fields.removeById("select267881136")

  // remove field
  collection.fields.removeById("number237877819")

  // remove field
  collection.fields.removeById("number2243249177")

  // remove field
  collection.fields.removeById("bool195311921")

  // remove field
  collection.fields.removeById("date1599238104")

  // remove field
  collection.fields.removeById("date1384857883")

  // remove field
  collection.fields.removeById("date1510825750")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // add field
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

  // add field
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

  // add field
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

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "estadoPago",
    "presentable": false,
    "required": true,
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

  // add field
  collection.fields.addAt(5, new Field({
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

  // add field
  collection.fields.addAt(6, new Field({
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

  // add field
  collection.fields.addAt(7, new Field({
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

  // add field
  collection.fields.addAt(8, new Field({
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

  // add field
  collection.fields.addAt(9, new Field({
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
  collection.fields.addAt(10, new Field({
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
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select267881136",
    "maxSelect": 1,
    "name": "estadoValidacion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "validado_vendedor",
      "validado_admin",
      "rechazado"
    ]
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "number237877819",
    "max": null,
    "min": null,
    "name": "pagosRealizados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number2243249177",
    "max": null,
    "min": null,
    "name": "precioOriginal",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "bool195311921",
    "name": "enganchePagado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "date1599238104",
    "max": "",
    "min": "",
    "name": "fechaPrimerPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "date1384857883",
    "max": "",
    "min": "",
    "name": "fechaProximoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "date1510825750",
    "max": "",
    "min": "",
    "name": "fechaCompletada",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
