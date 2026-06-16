/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "listRule": "@request.auth.role = \"admin\" || userId = @request.auth.id",
    "updateRule": "@request.auth.role = \"admin\" || (userId = @request.auth.id && estadoPago = \"pendiente_pago\")",
    "viewRule": "@request.auth.role = \"admin\" || userId = @request.auth.id"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
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
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_4092854851",
    "hidden": false,
    "id": "relation913937925",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "productId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(3, new Field({
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

  // add field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_128263769",
    "hidden": false,
    "id": "relation1140324512",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "cobradorId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1333114863",
    "hidden": false,
    "id": "relation1689920410",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "comprobanteId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select1882004807",
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

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select132775667",
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
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select2032993015",
    "maxSelect": 1,
    "name": "metodoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "qr_vendedor",
      "transferencia"
    ]
  }))

  // add field
  collection.fields.addAt(10, new Field({
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
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "number2526520864",
    "max": null,
    "min": null,
    "name": "enganche",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "bool195311921",
    "name": "enganchePagado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number1222512077",
    "max": null,
    "min": null,
    "name": "pagoSemanal",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select2170609155",
    "maxSelect": 1,
    "name": "frecuenciaPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "semanal",
      "quincenal"
    ]
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "number3835477567",
    "max": null,
    "min": null,
    "name": "semanasTotales",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number3521371141",
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
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "number1117022687",
    "max": null,
    "min": null,
    "name": "saldoRestante",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(18, new Field({
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
  collection.fields.addAt(19, new Field({
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
  collection.fields.addAt(20, new Field({
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
  collection.fields.addAt(21, new Field({
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
  collection.fields.addAt(22, new Field({
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
  collection.fields.addAt(23, new Field({
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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  // remove field
  collection.fields.removeById("relation1689669068")

  // remove field
  collection.fields.removeById("relation913937925")

  // remove field
  collection.fields.removeById("relation3748578879")

  // remove field
  collection.fields.removeById("relation1140324512")

  // remove field
  collection.fields.removeById("relation1689920410")

  // remove field
  collection.fields.removeById("select1882004807")

  // remove field
  collection.fields.removeById("select3844014757")

  // remove field
  collection.fields.removeById("select132775667")

  // remove field
  collection.fields.removeById("select2032993015")

  // remove field
  collection.fields.removeById("number2243249177")

  // remove field
  collection.fields.removeById("number2526520864")

  // remove field
  collection.fields.removeById("bool195311921")

  // remove field
  collection.fields.removeById("number1222512077")

  // remove field
  collection.fields.removeById("select2170609155")

  // remove field
  collection.fields.removeById("number3835477567")

  // remove field
  collection.fields.removeById("number3521371141")

  // remove field
  collection.fields.removeById("number1117022687")

  // remove field
  collection.fields.removeById("number237877819")

  // remove field
  collection.fields.removeById("date1487669057")

  // remove field
  collection.fields.removeById("date3303131586")

  // remove field
  collection.fields.removeById("date1599238104")

  // remove field
  collection.fields.removeById("date1384857883")

  // remove field
  collection.fields.removeById("date1510825750")

  return app.save(collection)
})
