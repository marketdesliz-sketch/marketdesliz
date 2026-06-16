/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3320400938")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "listRule": "1=1",
    "updateRule": "@request.auth.id != \"\"",
    "viewRule": "1=1"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3320400938")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"admin\"",
    "deleteRule": "@request.auth.id != \"admin\"",
    "listRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"admin\"",
    "viewRule": "@request.auth.id != \"\""
  }, collection)

  return app.save(collection)
})
