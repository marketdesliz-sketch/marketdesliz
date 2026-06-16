/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // add field
  collection.fields.addAt(35, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1706581865",
    "max": 0,
    "min": 0,
    "name": "codigoColonia",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(24, new Field({
    "hidden": false,
    "id": "number2271227848",
    "max": null,
    "min": null,
    "name": "nivel",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(29, new Field({
    "hidden": false,
    "id": "number99880772",
    "max": null,
    "min": null,
    "name": "productosComprados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(30, new Field({
    "hidden": false,
    "id": "number584269797",
    "max": null,
    "min": null,
    "name": "productosPagados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // remove field
  collection.fields.removeById("text1706581865")

  // update field
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

  // update field
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

  // update field
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

  return app.save(collection)
})
