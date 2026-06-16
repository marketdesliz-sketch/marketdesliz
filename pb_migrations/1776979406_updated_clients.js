/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // remove field
  collection.fields.removeById("date3692052792")

  // remove field
  collection.fields.removeById("number2604135253")

  // remove field
  collection.fields.removeById("number3508841548")

  // add field
  collection.fields.addAt(33, new Field({
    "hidden": false,
    "id": "number3942894169",
    "max": null,
    "min": null,
    "name": "deudaActual",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "date3692052792",
    "max": "",
    "min": "",
    "name": "ultimaCompra",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(25, new Field({
    "hidden": false,
    "id": "number2604135253",
    "max": null,
    "min": null,
    "name": "limiteDeudaActual",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(26, new Field({
    "hidden": false,
    "id": "number3508841548",
    "max": null,
    "min": null,
    "name": "maxProductosCurso",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // remove field
  collection.fields.removeById("number3942894169")

  return app.save(collection)
})
