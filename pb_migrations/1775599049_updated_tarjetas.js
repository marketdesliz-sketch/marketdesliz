/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1597317552")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number3235478179",
    "max": null,
    "min": 1,
    "name": "numeroTarjeta",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1405488821",
    "max": 0,
    "min": 0,
    "name": "numeroTarjetaFormateado",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1597317552")

  // remove field
  collection.fields.removeById("number3235478179")

  // remove field
  collection.fields.removeById("text1405488821")

  return app.save(collection)
})
