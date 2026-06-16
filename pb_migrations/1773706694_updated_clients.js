/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_U35wa3haia` ON `clients` (`telefono`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_U35wa3haia` ON `clients` (`telefono`)"
    ]
  }, collection)

  return app.save(collection)
})
