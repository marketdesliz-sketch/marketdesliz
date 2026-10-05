/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3471311855",
    "max": 0,
    "min": 0,
    "name": "gafeteNumero",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "date3458593499",
    "max": "",
    "min": "",
    "name": "fechaActivacion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // remove field
  collection.fields.removeById("text3471311855")

  // remove field
  collection.fields.removeById("date3458593499")

  return app.save(collection)
})
