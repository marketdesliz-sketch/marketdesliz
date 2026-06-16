/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "updateRule": "@request.auth.role = \"admin\" || (userId = @request.auth.id && estadoValidacion = \"pendiente\")",
    "viewRule": "@request.auth.role = \"admin\" || userId = @request.auth.id"
  }, collection)

  return app.save(collection)
})
