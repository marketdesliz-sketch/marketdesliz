/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2687480828")

  // update collection data
  unmarshal({
    "listRule": "1=1",
    "viewRule": "1=1"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2687480828")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" || @request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id != \"\" || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
})
