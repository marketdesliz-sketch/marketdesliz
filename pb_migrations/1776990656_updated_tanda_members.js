/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3934662078")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool3955132774",
    "name": "gasFeePaid",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "date2904712964",
    "max": "",
    "min": "",
    "name": "joinedAt",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3934662078")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool3955132774",
    "name": "gasFeePagado",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "date2904712964",
    "max": "",
    "min": "",
    "name": "fechaUnion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
