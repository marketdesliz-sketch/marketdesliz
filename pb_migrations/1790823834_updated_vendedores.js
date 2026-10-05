/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // remove field
  collection.fields.removeById("number269715823")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "number269715823",
    "max": null,
    "min": null,
    "name": "comision",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
