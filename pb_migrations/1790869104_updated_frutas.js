/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1637706055")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id = userId || @request.auth.role = \"admin\"",
    "updateRule": "@request.auth.id = userId || @request.auth.role = \"admin\""
  }, collection)

  // update field
  collection.fields.addAt(18, new Field({
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
  const collection = app.findCollectionByNameOrId("pbc_1637706055")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id = usuarioId || @request.auth.role = \"admin\"",
    "updateRule": "@request.auth.id = usuarioId || @request.auth.role = \"admin\""
  }, collection)

  // update field
  collection.fields.addAt(18, new Field({
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
