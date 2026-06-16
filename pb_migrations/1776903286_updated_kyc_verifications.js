/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "file2733648594",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "cartaCompromiso",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
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

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "date2696597936",
    "max": "",
    "min": "",
    "name": "fechaRevision",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "date4135633633",
    "max": "",
    "min": "",
    "name": "fechaExpiracion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
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
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "file3656096993",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "selfie",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // remove field
  collection.fields.removeById("file2733648594")

  // remove field
  collection.fields.removeById("relation2534931836")

  // remove field
  collection.fields.removeById("date2696597936")

  // remove field
  collection.fields.removeById("date4135633633")

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
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "file3656096993",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "foto",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
