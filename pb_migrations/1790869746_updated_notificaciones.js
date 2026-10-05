/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_555007670")

  // remove field
  collection.fields.removeById("text3329859325")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_555007670")

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3329859325",
    "max": 0,
    "min": 0,
    "name": "entidadTipo",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
