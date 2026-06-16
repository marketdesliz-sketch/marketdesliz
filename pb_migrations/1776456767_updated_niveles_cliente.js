/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3756124705")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role = \"admin\" || clienteId = @request.auth.id",
    "updateRule": "@request.auth.role = \"admin\" || clienteId = @request.auth.id",
    "viewRule": "@request.auth.role = \"admin\" || clienteId = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3756124705")

  // update collection data
  unmarshal({
    "listRule": "clienteId = @request.auth.id || @request.auth.role = \"admin\"",
    "updateRule": "clienteId = @request.auth.id || @request.auth.role = \"admin\"",
    "viewRule": "clienteId = @request.auth.id || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
})
