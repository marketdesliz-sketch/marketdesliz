/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "file882009953",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fechaAfiliacion",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "file882009953",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fecha_afiliacion",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
