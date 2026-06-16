/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // remove field
  collection.fields.removeById("date15224977362")

  // remove field
  collection.fields.removeById("relation2534931836")

  // update field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "file3913228779",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "idFront",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file506699689",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "idBack",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation3366472445",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "revisadoPor",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "date15224977362",
    "max": "",
    "min": "",
    "name": "submittedAt",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation2534931836",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "revisadoPor",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "file3913228779",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "ineFrente",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file506699689",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "ineReverso",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation3366472445",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "reviewedBy",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
