/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3934662078")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "date72540946",
    "max": "",
    "min": "",
    "name": "fechaPagoTurno",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "estadoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "al_corriente",
      "atrasado",
      "pagado"
    ]
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool3955132774",
    "name": "gasFeePagado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "date2904712964",
    "max": "",
    "min": "",
    "name": "fechaUnion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3934662078")

  // remove field
  collection.fields.removeById("date72540946")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pendiente",
      "activo",
      "completado"
    ]
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool3955132774",
    "name": "gasFeePaid",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "date2904712964",
    "max": "",
    "min": "",
    "name": "joinedAt",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
