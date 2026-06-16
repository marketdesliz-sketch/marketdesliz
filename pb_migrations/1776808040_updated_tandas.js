/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2482852971")

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "number3481378062",
    "max": null,
    "min": null,
    "name": "miembrosActuales",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2482852971")

  // remove field
  collection.fields.removeById("number3481378062")

  return app.save(collection)
})
