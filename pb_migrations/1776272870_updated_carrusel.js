/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3320400938")

  // remove field
  collection.fields.removeById("text633472412")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3320400938")

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text633472412",
    "max": 0,
    "min": 0,
    "name": "boton_enlace",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
