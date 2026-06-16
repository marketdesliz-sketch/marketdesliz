/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // remove field
  collection.fields.removeById("date938793416")

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "file938793416",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fecha_nacimiento",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "date938793416",
    "max": "",
    "min": "",
    "name": "fecha_nacimiento",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // remove field
  collection.fields.removeById("file938793416")

  return app.save(collection)
})
