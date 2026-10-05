/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_287802599")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\"",
    "listRule": "@request.auth.role = \"admin\" || userId = @request.auth.id",
    "updateRule": "@request.auth.role = \"admin\" || userId = @request.auth.id",
    "viewRule": "@request.auth.role = \"admin\" || userId = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_287802599")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" || @request.auth.id = \"\"",
    "listRule": "@request.auth.id != \"\" && (userId = @request.auth.id || @request.auth.role = \"admin\")",
    "updateRule": "@request.auth.id = userId || @request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id != \"\" && (userId = @request.auth.id || @request.auth.role = \"admin\")"
  }, collection)

  return app.save(collection)
})
