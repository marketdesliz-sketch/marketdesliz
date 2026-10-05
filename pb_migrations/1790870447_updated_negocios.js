/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // remove field
  collection.fields.removeById("text3797439395")

  // add field
  collection.fields.addAt(40, new Field({
    "hidden": false,
    "id": "json3797439395",
    "maxSize": 0,
    "name": "horario",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3797439395",
    "max": 0,
    "min": 0,
    "name": "horario",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("json3797439395")

  return app.save(collection)
})
