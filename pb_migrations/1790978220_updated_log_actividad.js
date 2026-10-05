/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1925455097")

  // remove field
  collection.fields.removeById("text2315445172")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select2315445172",
    "maxSelect": 1,
    "name": "accion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "create",
      "update",
      "delete"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1925455097")

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2315445172",
    "max": 0,
    "min": 0,
    "name": "accion",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("select2315445172")

  return app.save(collection)
})
