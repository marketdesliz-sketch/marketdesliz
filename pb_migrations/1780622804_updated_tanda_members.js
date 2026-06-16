/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3934662078")

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "bool2823015718",
    "name": "pagoPrimeraParte",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "bool145075174",
    "name": "pagoSegundaParte",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "date3335128838",
    "max": "",
    "min": "",
    "name": "fechaPagoPrimera",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "date3550590111",
    "max": "",
    "min": "",
    "name": "fechaPagoSegunda",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "bool3296111531",
    "name": "recordatorioEnviado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3934662078")

  // remove field
  collection.fields.removeById("bool2823015718")

  // remove field
  collection.fields.removeById("bool145075174")

  // remove field
  collection.fields.removeById("date3335128838")

  // remove field
  collection.fields.removeById("date3550590111")

  // remove field
  collection.fields.removeById("bool3296111531")

  return app.save(collection)
})
