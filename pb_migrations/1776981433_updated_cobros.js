/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_637990001")

  // remove field
  collection.fields.removeById("date1008021896")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_637990001")

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "date1008021896",
    "max": "",
    "min": "",
    "name": "scheduledDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
