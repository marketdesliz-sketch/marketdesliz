/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"admin\"",
    "deleteRule": "",
    "listRule": "@request.auth.role = \"admin\"",
    "updateRule": "userId = @request.auth.id || @request.auth.role = \"admin\"",
    "viewRule": "userId = @request.auth.id || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update collection data
  unmarshal({
    "createRule": "1=1",
    "deleteRule": "1=1",
    "listRule": "1=1",
    "updateRule": "1=1",
    "viewRule": "1=1"
  }, collection)

  return app.save(collection)
})
