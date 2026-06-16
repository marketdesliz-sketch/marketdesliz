/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "date2341479303",
    "max": "",
    "min": "",
    "name": "fecha_solicitud",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // remove field
  collection.fields.removeById("date2341479303")

  return app.save(collection)
})
