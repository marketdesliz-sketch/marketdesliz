/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // remove field
  collection.fields.removeById("file3880719953")

  // remove field
  collection.fields.removeById("file938793416")

  // remove field
  collection.fields.removeById("file2341479303")

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "date3484194835",
    "max": "",
    "min": "",
    "name": "fechaSolicitud",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "date505711909",
    "max": "",
    "min": "",
    "name": "fechaActualizacion",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "date3235033646",
    "max": "",
    "min": "",
    "name": "fechaNacimiento",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "file3880719953",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fechaActualizacion",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "file938793416",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fechaNacimiento",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "file2341479303",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "fechaSolicitud",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // remove field
  collection.fields.removeById("date3484194835")

  // remove field
  collection.fields.removeById("date505711909")

  // remove field
  collection.fields.removeById("date3235033646")

  return app.save(collection)
})
