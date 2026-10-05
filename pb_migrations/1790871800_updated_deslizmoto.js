/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1024151009")

  // update collection data
  unmarshal({
    "name": "servicios_propios"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1024151009")

  // update collection data
  unmarshal({
    "name": "deslizmoto"
  }, collection)

  return app.save(collection)
})
