/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1024151009")

  // add field
  collection.fields.addAt(15, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2757060279",
    "hidden": false,
    "id": "relation375773036",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "servicioId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1024151009")

  // remove field
  collection.fields.removeById("relation375773036")

  return app.save(collection)
})
