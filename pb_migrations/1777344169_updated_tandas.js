/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2482852971")

  // remove field
  collection.fields.removeById("number3141152758")

  // remove field
  collection.fields.removeById("date1269603864")

  // remove field
  collection.fields.removeById("text3940940989")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2482852971")

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "number3141152758",
    "max": null,
    "min": null,
    "name": "totalMembers",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "date1269603864",
    "max": "",
    "min": "",
    "name": "startDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3940940989",
    "max": 0,
    "min": 0,
    "name": "collectionDay",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
