/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3896138174")

  // remove field
  collection.fields.removeById("relation4180551237")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3896138174")

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2687480828",
    "hidden": false,
    "id": "relation4180551237",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "categoriaId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
