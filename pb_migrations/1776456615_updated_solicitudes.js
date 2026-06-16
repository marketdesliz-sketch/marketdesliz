/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4075287140")

  // remove field
  collection.fields.removeById("number2770866498")

  // remove field
  collection.fields.removeById("json1155799219")

  // remove field
  collection.fields.removeById("json1365586463")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4075287140")

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number2770866498",
    "max": null,
    "min": null,
    "name": "ultimoPago",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "json1155799219",
    "maxSize": 0,
    "name": "historialPagos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(28, new Field({
    "hidden": false,
    "id": "json1365586463",
    "maxSize": 0,
    "name": "clienteDataSnapshot",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
})
