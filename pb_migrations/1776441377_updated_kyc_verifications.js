/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // remove field
  collection.fields.removeById("date2341479303")

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "file2341479303",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fecha_solicitud",
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
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "date2341479303",
    "max": "",
    "min": "",
    "name": "fecha_solicitud",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // remove field
  collection.fields.removeById("file2341479303")

  return app.save(collection)
})
