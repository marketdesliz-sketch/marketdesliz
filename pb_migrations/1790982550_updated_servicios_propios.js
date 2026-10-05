/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1024151009")

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number269715823",
    "max": null,
    "min": null,
    "name": "comisionPorcentaje",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1024151009")

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number269715823",
    "max": null,
    "min": null,
    "name": "comision",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
