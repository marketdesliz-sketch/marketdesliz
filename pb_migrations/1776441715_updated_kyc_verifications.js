/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role = \"admin\"",
    "updateRule": "@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.rol = \"admin\"",
    "updateRule": "@request.auth.rol = \"admin\"",
    "viewRule": "@request.auth.rol = \"admin\""
  }, collection)

  return app.save(collection)
})
