/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.role = \"admin\" || userId = @request.auth.id"
  }, collection)

  // update field
  collection.fields.addAt(15, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation4006211842",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "userId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1928099433")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.role = \"admin\" || usuarioId = @request.auth.id"
  }, collection)

  // update field
  collection.fields.addAt(15, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation4006211842",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "usuarioId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
