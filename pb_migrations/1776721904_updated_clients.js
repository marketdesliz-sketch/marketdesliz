/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // add field
  collection.fields.addAt(24, new Field({
    "hidden": false,
    "id": "number568939082",
    "max": null,
    "min": null,
    "name": "totalGastado",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(25, new Field({
    "hidden": false,
    "id": "date3692052792",
    "max": "",
    "min": "",
    "name": "ultimaCompra",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2442875294")

  // remove field
  collection.fields.removeById("number568939082")

  // remove field
  collection.fields.removeById("date3692052792")

  return app.save(collection)
})
