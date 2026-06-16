/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "number1315369478",
    "max": null,
    "min": null,
    "name": "totalVentas",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "number1481060287",
    "max": null,
    "min": null,
    "name": "totalComisiones",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2604406982")

  // remove field
  collection.fields.removeById("number1315369478")

  // remove field
  collection.fields.removeById("number1481060287")

  return app.save(collection)
})
