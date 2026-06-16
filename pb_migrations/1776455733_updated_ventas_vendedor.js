/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2506412937")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.role = \"admin\"     ",
    "listRule": "@request.auth.role = \"admin\" || vendedorId = @request.auth.id",
    "viewRule": "@request.auth.role = \"admin\" || vendedorId = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2506412937")

  // update collection data
  unmarshal({
    "deleteRule": null,
    "listRule": "vendedorId = @request.auth.id || @request.auth.role = \"admin\"",
    "viewRule": "vendedorId = @request.auth.id || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
})
