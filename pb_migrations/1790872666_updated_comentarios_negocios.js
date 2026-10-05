/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4130758584")

  // update collection data
  unmarshal({
    "name": "reviews_negocios"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4130758584")

  // update collection data
  unmarshal({
    "name": "comentarios_negocios"
  }, collection)

  return app.save(collection)
})
