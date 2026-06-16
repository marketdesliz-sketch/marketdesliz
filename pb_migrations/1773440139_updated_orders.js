/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select3397926328",
    "maxSelect": 1,
    "name": "paymentFrequency",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "weekly",
      "biweekly",
      "monthly"
    ]
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "number1417457498",
    "max": null,
    "min": null,
    "name": "paymentAmount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "number4270851724",
    "max": null,
    "min": null,
    "name": "installments",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(13, new Field({
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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // remove field
  collection.fields.removeById("select3397926328")

  // remove field
  collection.fields.removeById("number1417457498")

  // remove field
  collection.fields.removeById("number4270851724")

  // remove field
  collection.fields.removeById("date1269603864")

  return app.save(collection)
})
