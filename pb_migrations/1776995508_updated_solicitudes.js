/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4075287140")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role = \"admin\" || vendedorId = @request.auth.id || clienteId = @request.auth.id",
    "viewRule": "@request.auth.role = \"admin\" || vendedorId = @request.auth.id || clienteId = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4075287140")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role = \"admin\" || (vendedorId = @request.auth.id)",
    "viewRule": "@request.auth.role = \"admin\" || (vendedorId = @request.auth.id)"
  }, collection)

  return app.save(collection)
})
