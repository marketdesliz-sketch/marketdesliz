/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_555007670")

  // update collection data
  unmarshal({
    "listRule": "userId = @request.auth.id || @request.auth.role = \"admin\"",
    "updateRule": "userId = @request.auth.id",
    "viewRule": "userId = @request.auth.id || @request.auth.role = \"admin\""
  }, collection)

  // update field
  collection.fields.addAt(1, new Field({
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
  const collection = app.findCollectionByNameOrId("pbc_555007670")

  // update collection data
  unmarshal({
    "listRule": "usuarioId = @request.auth.id || @request.auth.role = \"admin\"",
    "updateRule": "usuarioId = @request.auth.id",
    "viewRule": "usuarioId = @request.auth.id || @request.auth.role = \"admin\""
  }, collection)

  // update field
  collection.fields.addAt(1, new Field({
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
