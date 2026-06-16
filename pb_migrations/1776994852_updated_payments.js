/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_631030571")

  // update collection data
  unmarshal({
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  // remove field
  collection.fields.removeById("date3275789471")

  // remove field
  collection.fields.removeById("date2350039535")

  // remove field
  collection.fields.removeById("select2063623452")

  // remove field
  collection.fields.removeById("relation4196627511")

  // remove field
  collection.fields.removeById("number3501145981")

  // remove field
  collection.fields.removeById("number2392944706")

  // remove field
  collection.fields.removeById("relation1689669068")

  // remove field
  collection.fields.removeById("number2328503987")

  // remove field
  collection.fields.removeById("relation1140324512")

  // remove field
  collection.fields.removeById("select2032993015")

  // remove field
  collection.fields.removeById("text2835243259")

  // remove field
  collection.fields.removeById("relation1689920410")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_631030571")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role = \"admin\" || userId = @request.auth.id",
    "updateRule": "@request.auth.role = \"admin\" || (userId = @request.auth.id && estado = \"pendiente\")",
    "viewRule": "@request.auth.role = \"admin\" || userId = @request.auth.id"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "date3275789471",
    "max": "",
    "min": "",
    "name": "fechaVencimiento",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date2350039535",
    "max": "",
    "min": "",
    "name": "fechaPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(3, new Field({
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
      "pagado",
      "atrasado",
      "parcial"
    ]
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3527180448",
    "hidden": false,
    "id": "relation4196627511",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "orderId",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number3501145981",
    "max": null,
    "min": null,
    "name": "numeroSemana",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2392944706",
    "max": null,
    "min": null,
    "name": "montoProgramado",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(7, new Field({
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
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number2328503987",
    "max": null,
    "min": null,
    "name": "montoPagado",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(9, new Field({
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
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select2032993015",
    "maxSelect": 1,
    "name": "metodoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "transferencia",
      "qr"
    ]
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2835243259",
    "max": 0,
    "min": 0,
    "name": "notasAdmin",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(12, new Field({
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

  return app.save(collection)
})
