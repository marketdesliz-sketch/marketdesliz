/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3137435868")

  // remove field
  collection.fields.removeById("text1369121172")

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "json1369121172",
    "maxSize": 0,
    "name": "datos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3137435868")

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1369121172",
    "max": 0,
    "min": 0,
    "name": "datos",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("json1369121172")

  return app.save(collection)
})
