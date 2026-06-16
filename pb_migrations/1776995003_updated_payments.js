/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_631030571")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role = \"admin\" || userId = @request.auth.id",
    "updateRule": "@request.auth.role = \"admin\" || (userId = @request.auth.id && estado = \"pendiente\")",
    "viewRule": "@request.auth.role = \"admin\" || userId = @request.auth.id"
  }, collection)

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2835243259",
    "max": 0,
    "min": 0,
    "name": "notasAdmin",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_631030571")

  // update collection data
  unmarshal({
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  // remove field
  collection.fields.removeById("text2835243259")

  return app.save(collection)
})
