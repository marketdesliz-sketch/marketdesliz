/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_287802599")

  // add field
  collection.fields.addAt(44, new Field({
    "hidden": false,
    "id": "date3245225945",
    "max": "",
    "min": "",
    "name": "fechaEvaluacion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(45, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1823281365",
    "max": 0,
    "min": 0,
    "name": "horaEvaluacion",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(46, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2866250862",
    "max": 0,
    "min": 0,
    "name": "lugarEvaluacion",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(47, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3027450437",
    "max": 0,
    "min": 0,
    "name": "direccionEvaluacion",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_287802599")

  // remove field
  collection.fields.removeById("date3245225945")

  // remove field
  collection.fields.removeById("text1823281365")

  // remove field
  collection.fields.removeById("text2866250862")

  // remove field
  collection.fields.removeById("text3027450437")

  return app.save(collection)
})
