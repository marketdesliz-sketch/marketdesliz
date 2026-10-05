/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_842911234")

  // update collection data
  unmarshal({
    "name": "empleos"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_842911234")

  // update collection data
  unmarshal({
    "name": "bolsa_trabajo"
  }, collection)

  return app.save(collection)
})
