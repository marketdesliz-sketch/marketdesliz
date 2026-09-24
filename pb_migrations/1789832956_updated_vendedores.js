/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text982552870",
    "max": 0,
    "min": 0,
    "name": "nombre",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3253144191",
    "max": 0,
    "min": 0,
    "name": "telefono",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "email3885137012",
    "name": "email",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "email"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2391147934",
    "max": 0,
    "min": 0,
    "name": "ciudad",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

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
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number269715823",
    "max": null,
    "min": null,
    "name": "comision",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "json1240522036",
    "maxSize": 0,
    "name": "diasDisponibles",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text168575076",
    "max": 0,
    "min": 0,
    "name": "horaInicio",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3057462905",
    "max": 0,
    "min": 0,
    "name": "horaFin",
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
  collection.fields.addAt(21, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_287802599",
    "hidden": false,
    "id": "relation3877642866",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "vacanteId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // remove field
  collection.fields.removeById("text982552870")

  // remove field
  collection.fields.removeById("text3253144191")

  // remove field
  collection.fields.removeById("email3885137012")

  // remove field
  collection.fields.removeById("text2391147934")

  // remove field
  collection.fields.removeById("text3471311855")

  // remove field
  collection.fields.removeById("number269715823")

  // remove field
  collection.fields.removeById("json1240522036")

  // remove field
  collection.fields.removeById("text168575076")

  // remove field
  collection.fields.removeById("text3057462905")

  // remove field
  collection.fields.removeById("date3458593499")

  // remove field
  collection.fields.removeById("relation3877642866")

  return app.save(collection)
})
