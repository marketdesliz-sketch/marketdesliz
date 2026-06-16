/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_506777218")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"admin\"",
    "listRule": "vendedorId = @request.auth.id || @request.auth.role = \"admin\"",
    "viewRule": "vendedorId = @request.auth.id || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_506777218")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.rol = \"admin\"",
    "listRule": "vendedorId = @request.auth.id || @request.auth.rol = \"admin\"",
    "viewRule": "vendedorId = @request.auth.id || @request.auth.rol = \"admin\""
  }, collection)

  return app.save(collection)
})
