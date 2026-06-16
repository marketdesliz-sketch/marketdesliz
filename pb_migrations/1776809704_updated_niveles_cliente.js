/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3756124705")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "number3577761809",
    "max": null,
    "min": null,
    "name": "productosFaltantes",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3756124705")

  // remove field
  collection.fields.removeById("number3577761809")

  return app.save(collection)
})
