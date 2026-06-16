/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number621261048",
    "max": null,
    "min": null,
    "name": "weeklyAmount",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number1657641776",
    "max": null,
    "min": null,
    "name": "totalWeeks",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number126293115",
    "max": null,
    "min": null,
    "name": "remainingBalance",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "number3309073873",
    "max": null,
    "min": null,
    "name": "downPayment",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "number674557499",
    "max": null,
    "min": null,
    "name": "totalPrice",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number621261048",
    "max": null,
    "min": null,
    "name": "weeklyAmount",
    "onlyInt": false,
    "presentable": true,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number1657641776",
    "max": null,
    "min": null,
    "name": "totalWeeks",
    "onlyInt": false,
    "presentable": true,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number126293115",
    "max": null,
    "min": null,
    "name": "remainingBalance",
    "onlyInt": false,
    "presentable": true,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "number3309073873",
    "max": null,
    "min": null,
    "name": "downPayment",
    "onlyInt": false,
    "presentable": true,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "number674557499",
    "max": null,
    "min": null,
    "name": "totalPrice",
    "onlyInt": false,
    "presentable": true,
    "required": true,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
