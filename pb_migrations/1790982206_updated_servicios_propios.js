/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1024151009")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number3229515823",
    "max": null,
    "min": null,
    "name": "serviciosRealizados",
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
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number3229515823",
    "max": null,
    "min": null,
    "name": "servicios",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
