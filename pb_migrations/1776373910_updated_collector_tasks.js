/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_637990001")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select2223302008",
    "maxSelect": 1,
    "name": "paymentMethod",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "qr",
      "transferencia"
    ]
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "date1008021896",
    "max": "",
    "min": "",
    "name": "scheduledDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1535054327",
    "max": 0,
    "min": 0,
    "name": "assignedTo",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text18589324",
    "max": 0,
    "min": 0,
    "name": "notes",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "file3870244367",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "assignedAt",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "file1718663312",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "completedAt",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_637990001")

  // remove field
  collection.fields.removeById("select2223302008")

  // remove field
  collection.fields.removeById("date1008021896")

  // remove field
  collection.fields.removeById("text1535054327")

  // remove field
  collection.fields.removeById("text18589324")

  // remove field
  collection.fields.removeById("file3870244367")

  // remove field
  collection.fields.removeById("file1718663312")

  return app.save(collection)
})
