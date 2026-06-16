/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3308137572")

  // update collection data
  unmarshal({
    "createRule": "1=1"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3308137572")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
})
