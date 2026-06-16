/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_jiEdCZ7RbH` ON `vendedores` (`email`)",
      "CREATE UNIQUE INDEX `idx_fQGriL7vOe` ON `vendedores` (`qrToken`)",
      "CREATE UNIQUE INDEX `idx_t9he6eBo01` ON `vendedores` (`codigo`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_jiEdCZ7RbH` ON `vendedores` (`email`)",
      "CREATE INDEX `idx_fQGriL7vOe` ON `vendedores` (`qrToken`)"
    ]
  }, collection)

  return app.save(collection)
})
