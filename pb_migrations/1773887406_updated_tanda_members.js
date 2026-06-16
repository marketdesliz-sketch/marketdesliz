/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3934662078")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "date2904712964",
    "max": "",
    "min": "",
    "name": "joinedAt",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3934662078")

  // remove field
  collection.fields.removeById("date2904712964")

  return app.save(collection)
})
