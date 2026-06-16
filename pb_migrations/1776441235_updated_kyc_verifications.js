/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "date2759241399",
    "max": "",
    "min": "",
    "name": "comprobante_domicilio",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_830465610")

  // remove field
  collection.fields.removeById("date2759241399")

  return app.save(collection)
})
