/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_287802599")

  // add field
  collection.fields.addAt(43, new Field({
    "hidden": false,
    "id": "json1023846187",
    "maxSize": 0,
    "name": "datosPuesto",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_287802599")

  // remove field
  collection.fields.removeById("json1023846187")

  return app.save(collection)
})
