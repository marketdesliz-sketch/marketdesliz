/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3320400938")

  // add field
  collection.fields.addAt(4, new Field({
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

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "json4260236163",
    "maxSize": 0,
    "name": "boton_posicion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3320400938")

  // remove field
  collection.fields.removeById("text633472412")

  // remove field
  collection.fields.removeById("json4260236163")

  return app.save(collection)
})
