/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // remove field
  collection.fields.removeById("number2868650187")

  // remove field
  collection.fields.removeById("number777123888")

  // remove field
  collection.fields.removeById("number2386483518")

  // remove field
  collection.fields.removeById("number3942894169")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "number2868650187",
    "max": null,
    "min": null,
    "name": "nivel",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number777123888",
    "max": null,
    "min": null,
    "name": "productosComprados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "number2386483518",
    "max": null,
    "min": null,
    "name": "productosPagados",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(19, new Field({
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
})
