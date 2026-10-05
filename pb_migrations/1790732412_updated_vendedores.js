/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // remove field
  collection.fields.removeById("text3471311855")

  // remove field
  collection.fields.removeById("date3458593499")

  // remove field
  collection.fields.removeById("bool477233122")

  // remove field
  collection.fields.removeById("select643686883")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // add field
  collection.fields.addAt(15, new Field({
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
  collection.fields.addAt(20, new Field({
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

  // add field
  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "bool477233122",
    "name": "activado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(23, new Field({
    "hidden": false,
    "id": "select643686883",
    "maxSelect": 1,
    "name": "estado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "activo"
    ]
  }))

  return app.save(collection)
})
