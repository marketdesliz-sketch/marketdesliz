/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_637990001")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "date3275789471",
    "max": "",
    "min": "",
    "name": "fechaProgramada",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select2223302008",
    "maxSelect": 1,
    "name": "metodoPago",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "qr",
      "transferencia"
    ]
  }))

  // update field
  collection.fields.addAt(13, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1535054327",
    "max": 0,
    "min": 0,
    "name": "asignadoA",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "file3870244367",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fechaAsignacion",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "file1718663312",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fechaCompletado",
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

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "date3275789471",
    "max": "",
    "min": "",
    "name": "fecha",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  // update field
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

  // update field
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

  // update field
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

  // update field
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
})
