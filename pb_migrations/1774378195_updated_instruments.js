/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_329383295")

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "number1261852256",
    "max": null,
    "min": null,
    "name": "stock",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_329383295")

  // remove field
  collection.fields.removeById("number1261852256")

  return app.save(collection)
})
