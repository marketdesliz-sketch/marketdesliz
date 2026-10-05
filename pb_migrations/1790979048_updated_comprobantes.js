/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1333114863")

  // remove field
  collection.fields.removeById("date27834329")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1333114863")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date27834329",
    "max": "",
    "min": "",
    "name": "fecha",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
