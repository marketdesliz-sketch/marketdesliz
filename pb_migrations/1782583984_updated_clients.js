/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // add field
  collection.fields.addAt(38, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2078933438",
    "max": 0,
    "min": 0,
    "name": "direccionSector",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // remove field
  collection.fields.removeById("text2078933438")

  return app.save(collection)
})
