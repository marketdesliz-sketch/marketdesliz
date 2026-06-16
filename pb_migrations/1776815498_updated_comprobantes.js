/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1333114863")

  // remove field
  collection.fields.removeById("text2606963969")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "json2606963969",
    "maxSize": 0,
    "name": "mensaje",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1333114863")

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2606963969",
    "max": 0,
    "min": 0,
    "name": "mensaje",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("json2606963969")

  return app.save(collection)
})
