/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_287802599")

  // add field
  collection.fields.addAt(42, new Field({
    "hidden": false,
    "id": "bool191843956",
    "name": "altaCompletada",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(43, new Field({
    "hidden": false,
    "id": "bool3534968297",
    "name": "citaConfirmada",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(44, new Field({
    "hidden": false,
    "id": "date3100828351",
    "max": "",
    "min": "",
    "name": "fechaConfirmacionCita",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_287802599")

  // remove field
  collection.fields.removeById("bool191843956")

  // remove field
  collection.fields.removeById("bool3534968297")

  // remove field
  collection.fields.removeById("date3100828351")

  return app.save(collection)
})
