/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.role = \"admin\" || userId = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.role = \"admin\" || @request.auth.id = userId"
  }, collection)

  return app.save(collection)
})
