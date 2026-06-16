/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // add field
  collection.fields.addAt(23, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3896138174",
    "hidden": false,
    "id": "relation3064874480",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "subcategoriaId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // remove field
  collection.fields.removeById("relation3064874480")

  return app.save(collection)
})
