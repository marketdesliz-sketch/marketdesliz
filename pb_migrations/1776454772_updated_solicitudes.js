/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4075287140")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.role = \"admin\"   "
  }, collection)

  // remove field
  collection.fields.removeById("relation2373033017")

  // add field
  collection.fields.addAt(29, new Field({
    "hidden": false,
    "id": "number2373033017",
    "max": null,
    "min": null,
    "name": "tandaRondas",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4075287140")

  // update collection data
  unmarshal({
    "deleteRule": null
  }, collection)

  // add field
  collection.fields.addAt(21, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_379312381",
    "hidden": false,
    "id": "relation2373033017",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "tandaRondas",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // remove field
  collection.fields.removeById("number2373033017")

  return app.save(collection)
})
