/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3756124705")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\""
  }, collection)

  // remove field
  collection.fields.removeById("relation2777886149")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3756124705")

  // update collection data
  unmarshal({
    "listRule": "clienteId = @request.auth.id || @request.auth.role = \"admin\"",
    "updateRule": "clienteId = @request.auth.id || @request.auth.role = \"admin\"",
    "viewRule": "clienteId = @request.auth.id || @request.auth.role = \"admin\""
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2442875294",
    "hidden": false,
    "id": "relation2777886149",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "clienteId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
