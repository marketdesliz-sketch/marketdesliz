/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_128263769")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool1542800728",
    "name": "activo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_128263769")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool1542800728",
    "name": "field",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
