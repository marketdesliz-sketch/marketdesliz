/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3228971969")

  // update collection data
  unmarshal({
    "name": "config_sistema"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1692948619",
    "max": 0,
    "min": 0,
    "name": "clave",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "json780740392",
    "maxSize": 0,
    "name": "valor",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2687119104",
    "max": 0,
    "min": 0,
    "name": "descripcion",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool2636136329",
    "name": "editable",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3228971969")

  // update collection data
  unmarshal({
    "name": "config_sistema_"
  }, collection)

  // remove field
  collection.fields.removeById("text1692948619")

  // remove field
  collection.fields.removeById("json780740392")

  // remove field
  collection.fields.removeById("text2687119104")

  // remove field
  collection.fields.removeById("bool2636136329")

  return app.save(collection)
})
