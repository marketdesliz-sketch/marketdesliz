/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // update field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "file2199507635",
    "maxSelect": 99,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "imagen",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // update field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "file2199507635",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "imagen",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
