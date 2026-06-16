/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_631030571")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date2350039535",
    "max": "",
    "min": "",
    "name": "paidDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_631030571")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date2350039535",
    "max": "",
    "min": "",
    "name": "paidDate",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
