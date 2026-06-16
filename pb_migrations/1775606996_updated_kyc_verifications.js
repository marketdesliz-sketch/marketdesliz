/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "file825769008",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "termsAcceptedAt",
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

  // remove field
  collection.fields.removeById("file825769008")

  return app.save(collection)
})
