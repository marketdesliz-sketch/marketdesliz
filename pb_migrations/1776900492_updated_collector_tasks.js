/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_637990001")

  // update collection data
  unmarshal({
    "name": "cobros"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_637990001")

  // update collection data
  unmarshal({
    "name": "collector_tasks"
  }, collection)

  return app.save(collection)
})
