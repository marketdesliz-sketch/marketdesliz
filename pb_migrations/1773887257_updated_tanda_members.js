/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3934662078")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2482852971",
    "hidden": false,
    "id": "relation4141133531",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "tanda",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2442875294",
    "hidden": false,
    "id": "relation3927763390",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "client",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3934662078")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2482852971",
    "hidden": false,
    "id": "relation4141133531",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "tandaId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2442875294",
    "hidden": false,
    "id": "relation3927763390",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "clientId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
