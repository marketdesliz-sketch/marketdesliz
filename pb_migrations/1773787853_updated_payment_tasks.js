/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3995430484")

  // update collection data
  unmarshal({
    "name": "tanda_payments"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3934662078",
    "hidden": false,
    "id": "relation806490648",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "tandaMember",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number3447185927",
    "max": null,
    "min": null,
    "name": "roundNumber",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number2392944706",
    "max": null,
    "min": null,
    "name": "amount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pending",
      "paid",
      "late"
    ]
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "date2350039535",
    "max": "",
    "min": "",
    "name": "paidDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3995430484")

  // update collection data
  unmarshal({
    "name": "payment_tasks"
  }, collection)

  // remove field
  collection.fields.removeById("relation806490648")

  // remove field
  collection.fields.removeById("number3447185927")

  // remove field
  collection.fields.removeById("number2392944706")

  // remove field
  collection.fields.removeById("select2063623452")

  // remove field
  collection.fields.removeById("date2350039535")

  return app.save(collection)
})
