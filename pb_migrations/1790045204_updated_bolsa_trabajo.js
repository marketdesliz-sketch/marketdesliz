/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_842911234")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id != \"\" && (userId = @request.auth.id || @request.auth.role = \"admin\")",
    "updateRule": "@request.auth.id != \"\" && (userId = @request.auth.id || @request.auth.role = \"admin\")"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_842911234")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.role = \"admin\"",
    "updateRule": "@request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
})
