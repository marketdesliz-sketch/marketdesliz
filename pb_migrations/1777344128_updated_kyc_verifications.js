/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "file3656096993",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "foto",
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

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "file3656096993",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "selfie",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
