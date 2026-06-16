/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // add field
  collection.fields.addAt(24, new Field({
    "hidden": false,
    "id": "number2271227848",
    "max": null,
    "min": null,
    "name": "nivelActual",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
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

  // add field
  collection.fields.addAt(27, new Field({
    "hidden": false,
    "id": "bool1348538761",
    "name": "documentosCompletos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(28, new Field({
    "hidden": false,
    "id": "json4092298133",
    "maxSize": 0,
    "name": "ubicacionGPS",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(29, new Field({
    "hidden": false,
    "id": "number99880772",
    "max": null,
    "min": null,
    "name": "totalProductosComprados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(30, new Field({
    "hidden": false,
    "id": "number584269797",
    "max": null,
    "min": null,
    "name": "totalProductosPagados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(31, new Field({
    "hidden": false,
    "id": "date2956787380",
    "max": "",
    "min": "",
    "name": "fechaPrimerCompra",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(32, new Field({
    "hidden": false,
    "id": "date3131829448",
    "max": "",
    "min": "",
    "name": "fechaUltimoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(33, new Field({
    "hidden": false,
    "id": "bool2308821219",
    "name": "aceptaTerminos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(34, new Field({
    "hidden": false,
    "id": "date734240834",
    "max": "",
    "min": "",
    "name": "fechaAceptaTerminos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // remove field
  collection.fields.removeById("number2271227848")

  // remove field
  collection.fields.removeById("number2604135253")

  // remove field
  collection.fields.removeById("number3508841548")

  // remove field
  collection.fields.removeById("bool1348538761")

  // remove field
  collection.fields.removeById("json4092298133")

  // remove field
  collection.fields.removeById("number99880772")

  // remove field
  collection.fields.removeById("number584269797")

  // remove field
  collection.fields.removeById("date2956787380")

  // remove field
  collection.fields.removeById("date3131829448")

  // remove field
  collection.fields.removeById("bool2308821219")

  // remove field
  collection.fields.removeById("date734240834")

  return app.save(collection)
})
