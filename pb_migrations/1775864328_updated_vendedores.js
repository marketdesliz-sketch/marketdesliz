/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "listRule": "@request.auth.role = \"admin\"",
    "updateRule": "@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.rol = \"admin\"",
    "deleteRule": "@request.auth.rol = \"admin\"",
    "listRule": "@request.auth.rol = \"admin\"",
    "updateRule": "@request.auth.rol = \"admin\"",
    "viewRule": "@request.auth.rol = \"admin\" || id = @request.auth.id"
  }, collection)

  return app.save(collection)
})
