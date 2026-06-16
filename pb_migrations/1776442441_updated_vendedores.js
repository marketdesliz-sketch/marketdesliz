/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_fQGriL7vOe` ON `vendedores` (`qrToken`)",
      "CREATE UNIQUE INDEX `idx_t9he6eBo01` ON `vendedores` (`codigo`)"
    ]
  }, collection)

  // remove field
  collection.fields.removeById("email3885137012")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_jiEdCZ7RbH` ON `vendedores` (`email`)",
      "CREATE UNIQUE INDEX `idx_fQGriL7vOe` ON `vendedores` (`qrToken`)",
      "CREATE UNIQUE INDEX `idx_t9he6eBo01` ON `vendedores` (`codigo`)"
    ]
  }, collection)

  // add field
  collection.fields.addAt(9, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "email3885137012",
    "name": "email",
    "onlyDomains": null,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "email"
  }))

  return app.save(collection)
})
