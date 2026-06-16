/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3756124705")

  // remove field
  collection.fields.removeById("text982552870")

  // remove field
  collection.fields.removeById("number282232229")

  // remove field
  collection.fields.removeById("number3767909221")

  // remove field
  collection.fields.removeById("number944533700")

  // remove field
  collection.fields.removeById("number1099410099")

  // remove field
  collection.fields.removeById("number4006693837")

  // remove field
  collection.fields.removeById("bool1282619419")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3756124705")

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text982552870",
    "max": 0,
    "min": 0,
    "name": "nombre",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "number282232229",
    "max": null,
    "min": null,
    "name": "monto",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number3767909221",
    "max": null,
    "min": null,
    "name": "nivelRequerido",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number944533700",
    "max": null,
    "min": null,
    "name": "productosRequeridos",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "number1099410099",
    "max": null,
    "min": null,
    "name": "cupoMaximo",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number4006693837",
    "max": null,
    "min": null,
    "name": "cupoDisponible",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "bool1282619419",
    "name": "activa",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
