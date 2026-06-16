/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // add field
  collection.fields.addAt(17, new Field({
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
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "bool195311921",
    "name": "enganchePagado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(19, new Field({
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
  collection.fields.addAt(20, new Field({
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
  collection.fields.addAt(21, new Field({
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
  collection.fields.addAt(22, new Field({
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
      "pendiente_pago",
      "activa",
      "completada",
      "cancelada",
      "atrasada"
    ]
  }))

  // update field
  collection.fields.addAt(15, new Field({
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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // remove field
  collection.fields.removeById("number2243249177")

  // remove field
  collection.fields.removeById("bool195311921")

  // remove field
  collection.fields.removeById("relation1140324512")

  // remove field
  collection.fields.removeById("date1599238104")

  // remove field
  collection.fields.removeById("date1384857883")

  // remove field
  collection.fields.removeById("date1510825750")

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
})
