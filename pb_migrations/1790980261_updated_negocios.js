/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // add field
  collection.fields.addAt(40, new Field({
    "hidden": false,
    "id": "file2648205508",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "portada",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(32, new Field({
    "hidden": false,
    "id": "bool2336917078",
    "name": "domicilio",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // remove field
  collection.fields.removeById("file2648205508")

  // update field
  collection.fields.addAt(32, new Field({
    "hidden": false,
    "id": "bool2336917078",
    "name": "domiciliobool",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
